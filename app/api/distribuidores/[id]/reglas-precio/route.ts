import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'
import { cleanPricingRuleList, syncPricingRuleForDistributor } from '@/lib/services/pricingRuleSync'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables Supabase en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const admin = adminClient()

    const [{ data: rules, error: rulesError }, { data: servicios, error: serviciosError }, { data: overrides, error: overridesError }] = await Promise.all([
      admin
        .from('akcloud_reglas_precios')
        .select('id,nombre,tipo,servicio_principal_slug,servicios_gratis,servicios_requeridos,precio_conjunto,solo_distribuidores,activo,orden,nota')
        .eq('activo', true)
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true }),
      admin
        .from('akcloud_servicios')
        .select('id,nombre,slug,categoria,precio,activo,orden')
        .eq('activo', true)
        .order('orden', { ascending: true }),
      admin
        .from('distribuidor_precios')
        .select('servicio_id,precio')
        .eq('distribuidor_id', params.id),
    ])

    if (rulesError) throw rulesError
    if (serviciosError) throw serviciosError
    if (overridesError) throw overridesError

    const overrideMap = new Map((overrides || []).map((row: any) => [String(row.servicio_id), Number(row.precio)]))
    const serviciosConPrecio = (servicios || []).map((servicio: any) => {
      const personalizado = overrideMap.has(String(servicio.id))
      const precioBase = Number(servicio.precio || 0)
      return {
        ...servicio,
        precio: precioBase,
        precioEfectivo: personalizado ? overrideMap.get(String(servicio.id))! : precioBase,
        personalizado,
      }
    })

    const mapped = (rules || []).map((rule: any) => {
      const ids = cleanPricingRuleList(rule.solo_distribuidores)
      return {
        id: String(rule.id),
        nombre: String(rule.nombre),
        tipo: String(rule.tipo || 'extras_gratis'),
        servicioPrincipalSlug: String(rule.servicio_principal_slug || ''),
        serviciosGratis: cleanPricingRuleList(rule.servicios_gratis),
        serviciosRequeridos: cleanPricingRuleList(rule.servicios_requeridos),
        precioConjunto: rule.precio_conjunto == null ? null : Number(rule.precio_conjunto),
        enabledForDistributor: ids.includes(params.id),
        orden: Number(rule.orden || 100),
        nota: rule.nota || null,
      }
    })

    return NextResponse.json({ rules: mapped, servicios: serviciosConPrecio })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando reglas de precios' }, { status })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { usuario } = await requireStaff()
    const admin = adminClient()
    const body = await request.json()
    const ruleId = String(body.ruleId || '').trim()
    if (!ruleId) return NextResponse.json({ error: 'Falta ruleId' }, { status: 400 })

    const { data: rule, error: ruleError } = await admin
      .from('akcloud_reglas_precios')
      .select('*')
      .eq('id', ruleId)
      .eq('activo', true)
      .maybeSingle()
    if (ruleError) throw ruleError
    if (!rule) return NextResponse.json({ error: 'La regla no existe' }, { status: 404 })

    const enabled = body.enabled === true
    const currentIds = cleanPricingRuleList(rule.solo_distribuidores)

    if (enabled && String(rule.tipo) === 'combo_fijo') {
      const targetSlugs = new Set(cleanPricingRuleList(rule.servicios_requeridos))
      const { data: otherRules, error: conflictError } = await admin
        .from('akcloud_reglas_precios')
        .select('id,nombre,servicios_requeridos')
        .eq('activo', true)
        .eq('tipo', 'combo_fijo')
        .neq('id', ruleId)
        .contains('solo_distribuidores', [params.id])
      if (conflictError) throw conflictError

      const conflict = (otherRules || []).find((other: any) => cleanPricingRuleList(other.servicios_requeridos).some((slug) => targetSlugs.has(slug)))
      if (conflict) {
        return NextResponse.json({
          error: `No se puede activar porque comparte un servicio con el pack "${conflict.nombre}". Desactiva primero esa regla para evitar descuentos dobles.`,
        }, { status: 409 })
      }
    }

    const nextIds = enabled
      ? Array.from(new Set([...currentIds, params.id]))
      : currentIds.filter((id: string) => id !== params.id)

    const { error: updateError } = await admin
      .from('akcloud_reglas_precios')
      .update({ solo_distribuidores: nextIds, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
    if (updateError) throw updateError

    await syncPricingRuleForDistributor(admin, params.id, rule, enabled)

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'alternar_regla_precio',
      descripcion: `${enabled ? 'Activada' : 'Desactivada'} regla "${rule.nombre}"`,
      entidad: 'akcloud_reglas_precios',
      entidad_id: ruleId,
      metadata: { distribuidor_id: params.id, enabled, tipo: rule.tipo },
    })

    return NextResponse.json({ ok: true, enabled })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando reglas de precios' }, { status })
  }
}
