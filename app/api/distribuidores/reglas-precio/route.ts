import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'
import {
  cleanPricingRuleList,
  removePricingRuleForAllEnabled,
  syncPricingRuleForAllEnabled,
} from '@/lib/services/pricingRuleSync'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables Supabase en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function normalizeRule(body: any) {
  const nombre = String(body.nombre || '').trim()
  const tipo = body.tipo === 'combo_fijo' ? 'combo_fijo' : 'extras_gratis'
  const servicioPrincipalSlug = String(body.servicioPrincipalSlug || '').trim()
  const serviciosGratis = cleanPricingRuleList(body.serviciosGratis).filter((slug) => slug !== servicioPrincipalSlug)
  const serviciosRequeridos = cleanPricingRuleList(body.serviciosRequeridos)
  const precioConjunto = body.precioConjunto == null || body.precioConjunto === '' ? null : Number(body.precioConjunto)

  if (!nombre) throw new Error('Pon un nombre a la regla')

  if (tipo === 'combo_fijo') {
    if (serviciosRequeridos.length !== 2) throw new Error('Un pack de precio fijo debe tener exactamente dos servicios')
    if (precioConjunto == null || !Number.isFinite(precioConjunto) || precioConjunto < 0) throw new Error('Indica un precio total válido para el pack')
    return {
      nombre,
      tipo,
      servicio_principal_slug: serviciosRequeridos[0],
      servicios_gratis: [],
      servicios_requeridos: serviciosRequeridos,
      precio_conjunto: Number(precioConjunto.toFixed(2)),
      nota: String(body.nota || '').trim() || null,
    }
  }

  if (!servicioPrincipalSlug) throw new Error('Selecciona el servicio que activa la regla')
  if (!serviciosGratis.length) throw new Error('Selecciona al menos un servicio incluido')
  return {
    nombre,
    tipo,
    servicio_principal_slug: servicioPrincipalSlug,
    servicios_gratis: serviciosGratis,
    servicios_requeridos: [servicioPrincipalSlug],
    precio_conjunto: null,
    nota: String(body.nota || '').trim() || null,
  }
}

function isValidationError(message: string) {
  return /Pon un nombre|Selecciona|exactamente dos|precio total válido/.test(message)
}

export async function POST(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const admin = adminClient()
    const body = await request.json()
    const normalized = normalizeRule(body)

    const { data: created, error } = await admin
      .from('akcloud_reglas_precios')
      .insert({
        ...normalized,
        descuentos: {},
        solo_planes: [],
        solo_distribuidores: [],
        activo: true,
        orden: 100,
      })
      .select('id,nombre,tipo')
      .single()
    if (error) throw error

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'crear_regla_precio',
      descripcion: `Creada regla "${created.nombre}"`,
      entidad: 'akcloud_reglas_precios',
      entidad_id: created.id,
      metadata: { tipo: created.tipo },
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (error: any) {
    const message = error.message || 'Error creando la regla'
    const status = message === 'No autorizado' ? 401 : isValidationError(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const admin = adminClient()
    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const { data: existing, error: existingError } = await admin
      .from('akcloud_reglas_precios')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (existingError) throw existingError
    if (!existing) return NextResponse.json({ error: 'La regla no existe' }, { status: 404 })

    const normalized = normalizeRule(body)
    await removePricingRuleForAllEnabled(admin, existing)

    const { data: updated, error: updateError } = await admin
      .from('akcloud_reglas_precios')
      .update({ ...normalized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (updateError) throw updateError

    await syncPricingRuleForAllEnabled(admin, updated)

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'editar_regla_precio',
      descripcion: `Actualizada regla "${updated.nombre}"`,
      entidad: 'akcloud_reglas_precios',
      entidad_id: id,
      metadata: { tipo: updated.tipo },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const message = error.message || 'Error actualizando la regla'
    const status = message === 'No autorizado' ? 401 : isValidationError(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const admin = adminClient()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const { data: existing, error: existingError } = await admin
      .from('akcloud_reglas_precios')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (existingError) throw existingError
    if (!existing) return NextResponse.json({ error: 'La regla no existe' }, { status: 404 })

    await removePricingRuleForAllEnabled(admin, existing)

    const { error: updateError } = await admin
      .from('akcloud_reglas_precios')
      .update({ activo: false, solo_distribuidores: [], updated_at: new Date().toISOString() })
      .eq('id', id)
    if (updateError) throw updateError

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'eliminar_regla_precio',
      descripcion: `Desactivada regla "${existing.nombre}"`,
      entidad: 'akcloud_reglas_precios',
      entidad_id: id,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error eliminando la regla' }, { status })
  }
}
