import type { SupabaseClient } from '@supabase/supabase-js'

export function cleanPricingRuleList(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.map(String).map((v) => v.trim()).filter(Boolean))) : []
}

async function getServicesBySlugs(admin: SupabaseClient, slugs: string[]) {
  const unique = Array.from(new Set(slugs.filter(Boolean)))
  if (!unique.length) return []
  const { data, error } = await admin
    .from('akcloud_servicios')
    .select('id,slug,precio')
    .in('slug', unique)
  if (error) throw error
  return data || []
}

async function deletePairRows(admin: SupabaseClient, distribuidorId: string, aId: string, bId: string) {
  const first = await admin
    .from('distribuidor_precios_condicionales')
    .delete()
    .eq('distribuidor_id', distribuidorId)
    .eq('servicio_id', aId)
    .eq('requiere_servicio_id', bId)
  if (first.error) throw first.error

  const second = await admin
    .from('distribuidor_precios_condicionales')
    .delete()
    .eq('distribuidor_id', distribuidorId)
    .eq('servicio_id', bId)
    .eq('requiere_servicio_id', aId)
  if (second.error) throw second.error
}

export async function removePricingRuleSync(admin: SupabaseClient, distribuidorId: string, rule: any) {
  const tipo = String(rule.tipo || 'extras_gratis')

  if (tipo === 'combo_fijo') {
    const slugs = cleanPricingRuleList(rule.servicios_requeridos)
    if (slugs.length !== 2) return
    const servicios = await getServicesBySlugs(admin, slugs)
    const bySlug = new Map(servicios.map((s: any) => [String(s.slug), String(s.id)]))
    const aId = bySlug.get(slugs[0])
    const bId = bySlug.get(slugs[1])
    if (aId && bId) await deletePairRows(admin, distribuidorId, aId, bId)
    return
  }

  const triggerSlug = String(rule.servicio_principal_slug || '').trim()
  const freeSlugs = cleanPricingRuleList(rule.servicios_gratis)
  if (!triggerSlug || !freeSlugs.length) return

  const servicios = await getServicesBySlugs(admin, [triggerSlug, ...freeSlugs])
  const bySlug = new Map(servicios.map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (!triggerId || !targetIds.length) return

  const { error } = await admin
    .from('distribuidor_precios_condicionales')
    .delete()
    .eq('distribuidor_id', distribuidorId)
    .eq('requiere_servicio_id', triggerId)
    .in('servicio_id', targetIds)
  if (error) throw error
}

export async function syncPricingRuleForDistributor(admin: SupabaseClient, distribuidorId: string, rule: any, enabled = true) {
  await removePricingRuleSync(admin, distribuidorId, rule)
  if (!enabled) return

  const tipo = String(rule.tipo || 'extras_gratis')

  if (tipo === 'combo_fijo') {
    const slugs = cleanPricingRuleList(rule.servicios_requeridos)
    if (slugs.length !== 2) throw new Error('Los packs de precio fijo deben tener exactamente dos servicios')

    const servicios = await getServicesBySlugs(admin, slugs)
    const bySlug = new Map(servicios.map((s: any) => [String(s.slug), s]))
    const a = bySlug.get(slugs[0]) as any
    const b = bySlug.get(slugs[1]) as any
    if (!a || !b) throw new Error('Alguno de los servicios del pack ya no existe')

    const ids = [String(a.id), String(b.id)]
    const { data: overrides, error: overridesError } = await admin
      .from('distribuidor_precios')
      .select('servicio_id,precio')
      .eq('distribuidor_id', distribuidorId)
      .in('servicio_id', ids)
    if (overridesError) throw overridesError

    const overridesMap = new Map((overrides || []).map((row: any) => [String(row.servicio_id), Number(row.precio)]))
    const base = [
      { id: String(a.id), otherId: String(b.id), slug: String(a.slug), precio: overridesMap.has(String(a.id)) ? overridesMap.get(String(a.id))! : Number(a.precio || 0) },
      { id: String(b.id), otherId: String(a.id), slug: String(b.slug), precio: overridesMap.has(String(b.id)) ? overridesMap.get(String(b.id))! : Number(b.precio || 0) },
    ]

    const totalBase = Number(base.reduce((sum, item) => sum + item.precio, 0).toFixed(2))
    const precioPack = Number(rule.precio_conjunto ?? 0)
    if (!Number.isFinite(precioPack) || precioPack < 0) throw new Error('El precio del pack no es válido')

    // Una regla nunca aumenta el precio. Si el distribuidor ya paga menos por separado, se conservan sus precios.
    if (totalBase <= precioPack) return

    let descuentoPendiente = Number((totalBase - precioPack).toFixed(2))
    const finals = new Map(base.map((item) => [item.id, item.precio]))

    // Descontamos primero el servicio más caro. Si hace falta, continuamos con el segundo.
    for (const item of [...base].sort((x, y) => y.precio - x.precio)) {
      if (descuentoPendiente <= 0) break
      const current = finals.get(item.id) || 0
      const reduction = Math.min(current, descuentoPendiente)
      finals.set(item.id, Number((current - reduction).toFixed(2)))
      descuentoPendiente = Number((descuentoPendiente - reduction).toFixed(2))
    }

    const rows = base
      .filter((item) => Number(finals.get(item.id)) < item.precio)
      .map((item) => ({
        distribuidor_id: distribuidorId,
        servicio_id: item.id,
        requiere_servicio_id: item.otherId,
        precio: Number(finals.get(item.id) || 0),
        activo: true,
        updated_at: new Date().toISOString(),
      }))

    if (rows.length) {
      const { error } = await admin.from('distribuidor_precios_condicionales').insert(rows)
      if (error) throw error
    }
    return
  }

  const triggerSlug = String(rule.servicio_principal_slug || '').trim()
  const freeSlugs = cleanPricingRuleList(rule.servicios_gratis)
  if (!triggerSlug || !freeSlugs.length) throw new Error('La regla de extras está incompleta')

  const servicios = await getServicesBySlugs(admin, [triggerSlug, ...freeSlugs])
  const bySlug = new Map(servicios.map((s: any) => [String(s.slug), String(s.id)]))
  const triggerId = bySlug.get(triggerSlug)
  const targetIds = freeSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as string[]
  if (!triggerId) throw new Error(`No existe el servicio principal ${triggerSlug}`)
  if (!targetIds.length) throw new Error('No existen los servicios incluidos configurados')

  const rows = targetIds.map((servicioId) => ({
    distribuidor_id: distribuidorId,
    servicio_id: servicioId,
    requiere_servicio_id: triggerId,
    precio: 0,
    activo: true,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await admin.from('distribuidor_precios_condicionales').insert(rows)
  if (error) throw error
}

export async function syncPricingRuleForAllEnabled(admin: SupabaseClient, rule: any) {
  const distribuidorIds = cleanPricingRuleList(rule.solo_distribuidores)
  for (const distribuidorId of distribuidorIds) {
    await syncPricingRuleForDistributor(admin, distribuidorId, rule, true)
  }
}

export async function removePricingRuleForAllEnabled(admin: SupabaseClient, rule: any) {
  const distribuidorIds = cleanPricingRuleList(rule.solo_distribuidores)
  for (const distribuidorId of distribuidorIds) {
    await removePricingRuleSync(admin, distribuidorId, rule)
  }
}
