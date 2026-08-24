import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables Supabase en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function syncExtrasRule(
  admin: ReturnType<typeof adminClient>,
  distribuidorId: string,
  rule: any,
  enabled: boolean,
) {
  if (String(rule.tipo || 'extras_gratis') !== 'extras_gratis') return

  const triggerSlug = String(rule.servicio_principal_slug || '').trim()
  const freeSlugs = Array.isArray(rule.servicios_gratis)
    ? Array.from(new Set(rule.servicios_gratis.map(String).filter(Boolean)))
    : []
  if (!triggerSlug || !freeSlugs.length) return

  const { data: servicios, error } = await admin
    .from('akcloud_servicios')
    .select('id,slug')
    .in('slug', Array.from(new Set([triggerSlug, ...freeSlugs])))
  if (error) throw error

  const bySlug = new Map((servicios || []).map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  if (!triggerId) throw new Error(`No existe el servicio principal ${triggerSlug}`)

  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (!targetIds.length) return

  const { error: deleteError } = await admin
    .from('distribuidor_precios_condicionales')
    .delete()
    .eq('distribuidor_id', distribuidorId)
    .eq('requiere_servicio_id', triggerId)
    .in('servicio_id', targetIds)
  if (deleteError) throw deleteError

  if (!enabled) return

  const rows = targetIds.map((servicioId) => ({
    distribuidor_id: distribuidorId,
    servicio_id: servicioId,
    requiere_servicio_id: triggerId,
    precio: 0,
    activo: true,
    updated_at: new Date().toISOString(),
  }))
  const { error: insertError } = await admin.from('distribuidor_precios_condicionales').insert(rows)
  if (insertError) throw insertError
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const admin = adminClient()

    const [{ data: rules, error: rulesError }, { data: servicios, error: serviciosError }] = await Promise.all([
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
    ])

    if (rulesError) throw rulesError
    if (serviciosError) throw serviciosError

    const mapped = (rules || []).map((rule: any) => {
      const ids = Array.isArray(rule.solo_distribuidores) ? rule.solo_distribuidores.map(String) : []
      return {
        id: String(rule.id),
        nombre: String(rule.nombre),
        tipo: String(rule.tipo || 'extras_gratis'),
        servicioPrincipalSlug: String(rule.servicio_principal_slug || ''),
        serviciosGratis: Array.isArray(rule.servicios_gratis) ? rule.servicios_gratis.map(String) : [],
        serviciosRequeridos: Array.isArray(rule.servicios_requeridos) ? rule.servicios_requeridos.map(String) : [],
        precioConjunto: rule.precio_conjunto == null ? null : Number(rule.precio_conjunto),
        enabledForDistributor: ids.includes(params.id),
        orden: Number(rule.orden || 100),
        nota: rule.nota || null,
      }
    })

    return NextResponse.json({ rules: mapped, servicios: servicios || [] })
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
    const currentIds = Array.isArray(rule.solo_distribuidores) ? rule.solo_distribuidores.map(String) : []
    const nextIds = enabled
      ? Array.from(new Set([...currentIds, params.id]))
      : currentIds.filter((id: string) => id !== params.id)

    const { error: updateError } = await admin
      .from('akcloud_reglas_precios')
      .update({ solo_distribuidores: nextIds, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
    if (updateError) throw updateError

    await syncExtrasRule(admin, params.id, rule, enabled)

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
