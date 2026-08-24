import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables Supabase en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function cleanList(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.map(String).map((v) => v.trim()).filter(Boolean))) : []
}

function normalizeRule(body: any) {
  const nombre = String(body.nombre || '').trim()
  const tipo = body.tipo === 'combo_fijo' ? 'combo_fijo' : 'extras_gratis'
  const servicioPrincipalSlug = String(body.servicioPrincipalSlug || '').trim()
  const serviciosGratis = cleanList(body.serviciosGratis).filter((slug) => slug !== servicioPrincipalSlug)
  const serviciosRequeridos = cleanList(body.serviciosRequeridos)
  const precioConjunto = body.precioConjunto == null || body.precioConjunto === '' ? null : Number(body.precioConjunto)

  if (!nombre) throw new Error('Pon un nombre a la regla')

  if (tipo === 'combo_fijo') {
    if (serviciosRequeridos.length < 2) throw new Error('Un pack necesita al menos dos servicios')
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

async function deleteSyncedExtras(admin: ReturnType<typeof adminClient>, rule: any) {
  if (String(rule.tipo || 'extras_gratis') !== 'extras_gratis') return
  const distribuidorIds = Array.isArray(rule.solo_distribuidores) ? rule.solo_distribuidores.map(String) : []
  const triggerSlug = String(rule.servicio_principal_slug || '').trim()
  const freeSlugs = cleanList(rule.servicios_gratis)
  if (!distribuidorIds.length || !triggerSlug || !freeSlugs.length) return

  const { data: servicios, error } = await admin
    .from('akcloud_servicios')
    .select('id,slug')
    .in('slug', Array.from(new Set([triggerSlug, ...freeSlugs])))
  if (error) throw error

  const bySlug = new Map((servicios || []).map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (!triggerId || !targetIds.length) return

  const { error: deleteError } = await admin
    .from('distribuidor_precios_condicionales')
    .delete()
    .in('distribuidor_id', distribuidorIds)
    .eq('requiere_servicio_id', triggerId)
    .in('servicio_id', targetIds)
  if (deleteError) throw deleteError
}

async function syncExtrasForDistributors(admin: ReturnType<typeof adminClient>, rule: any) {
  if (String(rule.tipo || 'extras_gratis') !== 'extras_gratis') return
  const distribuidorIds = Array.isArray(rule.solo_distribuidores) ? rule.solo_distribuidores.map(String) : []
  if (!distribuidorIds.length) return

  const triggerSlug = String(rule.servicio_principal_slug || '').trim()
  const freeSlugs = cleanList(rule.servicios_gratis)
  if (!triggerSlug || !freeSlugs.length) return

  const { data: servicios, error } = await admin
    .from('akcloud_servicios')
    .select('id,slug')
    .in('slug', Array.from(new Set([triggerSlug, ...freeSlugs])))
  if (error) throw error

  const bySlug = new Map((servicios || []).map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (!triggerId || !targetIds.length) return

  const rows = distribuidorIds.flatMap((distribuidorId) => targetIds.map((servicioId) => ({
    distribuidor_id: distribuidorId,
    servicio_id: servicioId,
    requiere_servicio_id: triggerId,
    precio: 0,
    activo: true,
    updated_at: new Date().toISOString(),
  })))

  const { error: insertError } = await admin.from('distribuidor_precios_condicionales').insert(rows)
  if (insertError) throw insertError
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
    const status = error.message === 'No autorizado' ? 401 : error.message?.includes('Selecciona') || error.message?.includes('Pon ') || error.message?.includes('necesita') || error.message?.includes('precio total') ? 400 : 500
    return NextResponse.json({ error: error.message || 'Error creando la regla' }, { status })
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
    await deleteSyncedExtras(admin, existing)

    const { data: updated, error: updateError } = await admin
      .from('akcloud_reglas_precios')
      .update({ ...normalized, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (updateError) throw updateError

    await syncExtrasForDistributors(admin, updated)

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
    const status = error.message === 'No autorizado' ? 401 : error.message?.includes('Selecciona') || error.message?.includes('Pon ') || error.message?.includes('necesita') || error.message?.includes('precio total') ? 400 : 500
    return NextResponse.json({ error: error.message || 'Error actualizando la regla' }, { status })
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

    await deleteSyncedExtras(admin, existing)

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
