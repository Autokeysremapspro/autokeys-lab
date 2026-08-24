import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

const PRESET_NAME = 'Extras gratis con Stage 1'
const DEFAULT_TRIGGER = 'stage-1-coche'
const DEFAULT_FREE = ['dpf-off-coche','egr-off-coche','adblue-off-coche','decat-coche','pops-bangs-coche','hardcut-coche','launch-control-coche','dtc-off']

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan variables Supabase en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getOrCreatePreset(admin: ReturnType<typeof adminClient>) {
  const { data: existing, error } = await admin.from('akcloud_reglas_precios').select('*').eq('nombre', PRESET_NAME).maybeSingle()
  if (error) throw error
  if (existing) return existing
  const { data, error: insertError } = await admin.from('akcloud_reglas_precios').insert({
    nombre: PRESET_NAME,
    servicio_principal_slug: DEFAULT_TRIGGER,
    servicios_gratis: DEFAULT_FREE,
    descuentos: {}, solo_planes: [], solo_distribuidores: [], activo: true, orden: 10,
    nota: 'Plantilla administrable desde AK Core. Los extras quedan a 0 € solo si el pedido incluye el servicio principal.',
  }).select('*').single()
  if (insertError) throw insertError
  return data
}

async function syncRules(admin: ReturnType<typeof adminClient>, distribuidorId: string, triggerSlug: string, freeSlugs: string[], enabled: boolean) {
  const { data: servicios, error } = await admin.from('akcloud_servicios').select('id,slug').in('slug', Array.from(new Set([triggerSlug, ...freeSlugs])))
  if (error) throw error
  const bySlug = new Map((servicios || []).map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  if (!triggerId) throw new Error(`No existe el servicio principal ${triggerSlug}`)
  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (targetIds.length) {
    const { error: deleteError } = await admin.from('distribuidor_precios_condicionales').delete().eq('distribuidor_id', distribuidorId).eq('requiere_servicio_id', triggerId).in('servicio_id', targetIds)
    if (deleteError) throw deleteError
  }
  if (!enabled || !targetIds.length) return
  const rows = targetIds.map((servicioId) => ({ distribuidor_id: distribuidorId, servicio_id: servicioId, requiere_servicio_id: triggerId, precio: 0, activo: true, updated_at: new Date().toISOString() }))
  const { error: insertError } = await admin.from('distribuidor_precios_condicionales').insert(rows)
  if (insertError) throw insertError
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const admin = adminClient()
    const preset = await getOrCreatePreset(admin)
    const activeIds = Array.isArray(preset.solo_distribuidores) ? preset.solo_distribuidores.map(String) : []
    const { data: servicios, error } = await admin.from('akcloud_servicios').select('id,nombre,slug,categoria,precio,activo,orden').eq('activo', true).order('orden', { ascending: true })
    if (error) throw error
    return NextResponse.json({ preset: { id: preset.id, nombre: preset.nombre, activo: preset.activo !== false, enabledForDistributor: activeIds.includes(params.id), servicioPrincipalSlug: preset.servicio_principal_slug || DEFAULT_TRIGGER, serviciosGratis: Array.isArray(preset.servicios_gratis) ? preset.servicios_gratis : DEFAULT_FREE }, servicios: servicios || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando reglas de precios' }, { status })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { usuario } = await requireStaff()
    const admin = adminClient()
    const preset = await getOrCreatePreset(admin)
    const body = await request.json()
    const currentIds = Array.isArray(preset.solo_distribuidores) ? preset.solo_distribuidores.map(String) : []
    let triggerSlug = String(preset.servicio_principal_slug || DEFAULT_TRIGGER)
    let freeSlugs = Array.isArray(preset.servicios_gratis) ? preset.servicios_gratis.map(String) : DEFAULT_FREE

    if (body.action === 'configure') {
      triggerSlug = String(body.servicioPrincipalSlug || '').trim()
      const incoming = Array.isArray(body.serviciosGratis) ? body.serviciosGratis.map(String).filter(Boolean) : []
      freeSlugs = Array.from(new Set(incoming.filter((slug) => slug !== triggerSlug)))
      if (!triggerSlug || !freeSlugs.length) return NextResponse.json({ error: 'Selecciona un servicio principal y al menos un servicio incluido' }, { status: 400 })
      const { error: updateError } = await admin.from('akcloud_reglas_precios').update({ servicio_principal_slug: triggerSlug, servicios_gratis: freeSlugs, updated_at: new Date().toISOString() }).eq('id', preset.id)
      if (updateError) throw updateError
      for (const distribuidorId of currentIds) await syncRules(admin, distribuidorId, triggerSlug, freeSlugs, true)
    } else {
      const enabled = body.enabled === true
      const nextIds = enabled ? Array.from(new Set([...currentIds, params.id])) : currentIds.filter((id: string) => id !== params.id)
      const { error: updateError } = await admin.from('akcloud_reglas_precios').update({ solo_distribuidores: nextIds, updated_at: new Date().toISOString() }).eq('id', preset.id)
      if (updateError) throw updateError
      await syncRules(admin, params.id, triggerSlug, freeSlugs, enabled)
    }

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre, usuario_id: usuario.id, modulo: 'distribuidores',
      accion: body.action === 'configure' ? 'configurar_plantilla_precio' : 'alternar_plantilla_precio',
      descripcion: body.action === 'configure' ? `Plantilla "${PRESET_NAME}" actualizada` : `${body.enabled === true ? 'Activada' : 'Desactivada'} plantilla "${PRESET_NAME}"`,
      entidad: 'akcloud_reglas_precios', entidad_id: preset.id,
      metadata: { distribuidor_id: params.id, triggerSlug, freeSlugs, enabled: body.enabled === true },
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando reglas de precios' }, { status })
  }
}
