import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin, requireStaff } from '@/lib/supabase/server'
import { TARIFA_CATEGORIAS, type TarifaCategoria } from '@/types/tarifas'

const EDITABLE_FIELDS = [
  'categoria', 'familia', 'marca', 'modelo', 'anios', 'motor', 'sistema', 'ecu', 'combustible',
  'acceso', 'transponder', 'espadin', 'situacion', 'servicio', 'descripcion', 'pvp',
  'pvp_desde', 'pvp_hasta', 'precio_minimo', 'precio_taller_desde', 'precio_taller',
  'precio_taller_hasta', 'regla_precio', 'incluye', 'condiciones', 'plazo', 'requiere_laboratorio', 'activo',
] as const

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Falta la configuración segura de Supabase')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function statusFor(error: unknown) {
  return error instanceof Error && error.message === 'No autorizado' ? 403 : 500
}

function cleanText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function cleanPrice(value: unknown, required = false) {
  if (value === '' || value === null || value === undefined) {
    if (required) throw new Error('El PVP es obligatorio')
    return null
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error('El precio no es válido')
  return Math.round(number * 100) / 100
}

function roundUp5(value: number) {
  return Math.ceil(value / 5) * 5
}

function defaultRule(category: TarifaCategoria) {
  const rules: Record<TarifaCategoria, string> = {
    llaves: 'Desde: duplicado sencillo, llave presente y referencia confirmada. Recomendado: trabajo normal. Hasta: pérdida total, smart/protegida, apertura, desplazamiento o urgencia.',
    ecus: 'Desde: ECU identificada y desmontada, acceso directo. Recomendado: trabajo normal. Hasta: banco/boot, apertura, ECU protegida, donante, urgencia o riesgo adicional.',
    reparaciones: 'Desde: avería confirmada y módulo sin manipular. Recomendado: trabajo normal. Hasta: humedad, manipulación previa, donante, codificación, urgencia o garantía de mayor riesgo.',
    talleres: 'Desde: colaborador habitual, trabajo preparado y sin desplazamiento. Recomendado: tarifa profesional normal. Hasta: recogida, urgencia, diagnosis adicional o trabajo incompleto.',
    files: 'Desde: archivo estándar, lectura correcta y una entrega. Recomendado: servicio normal. Hasta: ECU protegida, solución combinada, urgencia, datalog o revisiones adicionales.',
  }
  return rules[category]
}

function parsePayload(body: Record<string, unknown>) {
  const categoria = String(body.categoria || '') as TarifaCategoria
  if (!TARIFA_CATEGORIAS.includes(categoria)) throw new Error('La categoría no es válida')
  const servicio = cleanText(body.servicio)
  if (!servicio) throw new Error('El nombre del servicio es obligatorio')

  const pvp = cleanPrice(body.pvp, true) as number
  const minimum = cleanPrice(body.precio_minimo)
  const workshop = cleanPrice(body.precio_taller)
  const requiresLab = Boolean(body.requiere_laboratorio)
  const situation = cleanText(body.situacion)
  const fromFactor = categoria === 'talleres' ? 0.95 : 0.90
  const toFactor = requiresLab || normalizeForRule(situation).includes('perdida') ? 1.25 : categoria === 'ecus' || categoria === 'reparaciones' ? 1.20 : 1.15
  const pvpFrom = cleanPrice(body.pvp_desde) ?? Math.min(pvp, Math.max(minimum ?? 0, roundUp5(pvp * fromFactor)))
  const pvpTo = cleanPrice(body.pvp_hasta) ?? roundUp5(pvp * toFactor)
  const workshopFrom = workshop === null ? null : cleanPrice(body.precio_taller_desde) ?? Math.min(workshop, roundUp5(workshop * 0.95))
  const workshopTo = workshop === null ? null : cleanPrice(body.precio_taller_hasta) ?? roundUp5(workshop * (requiresLab ? 1.20 : 1.12))

  if (pvpFrom > pvp || pvp > pvpTo) throw new Error('El PVP debe cumplir: Desde ≤ Recomendado ≤ Hasta')
  if (workshop !== null && (workshopFrom === null || workshopTo === null || workshopFrom > workshop || workshop > workshopTo)) {
    throw new Error('El precio de taller debe cumplir: Desde ≤ Recomendado ≤ Hasta')
  }

  const payload: Record<string, string | number | boolean | null> = {
    categoria,
    servicio,
    pvp,
    pvp_desde: pvpFrom,
    pvp_hasta: pvpTo,
    precio_minimo: minimum,
    precio_taller_desde: workshopFrom,
    precio_taller: workshop,
    precio_taller_hasta: workshopTo,
    regla_precio: cleanText(body.regla_precio) ?? defaultRule(categoria),
    requiere_laboratorio: requiresLab,
    activo: body.activo !== false,
  }

  for (const field of EDITABLE_FIELDS) {
    if (field in payload || ['pvp', 'pvp_desde', 'pvp_hasta', 'precio_minimo', 'precio_taller_desde', 'precio_taller', 'precio_taller_hasta'].includes(field)) continue
    payload[field] = cleanText(body[field])
  }
  return payload
}

function normalizeForRule(value: string | null) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

async function nextCode(category: TarifaCategoria) {
  const prefix: Record<TarifaCategoria, string> = { llaves: 'LLA', ecus: 'ECU', reparaciones: 'REP', talleres: 'TAL', files: 'FIL' }
  return `${prefix[category]}-N${Date.now().toString(36).toUpperCase()}`
}

export async function GET() {
  try {
    const { usuario } = await requireStaff()
    const canEdit = usuario.rol === 'admin'
    const fields = canEdit ? '*' : 'id,codigo,categoria,familia,marca,modelo,anios,motor,sistema,ecu,combustible,acceso,transponder,espadin,situacion,servicio,descripcion,pvp_desde,pvp,pvp_hasta,precio_taller_desde,precio_taller,precio_taller_hasta,regla_precio,incluye,condiciones,plazo,requiere_laboratorio,activo,orden,created_at,updated_at'
    const { data, error } = await adminClient()
      .from('tarifas_servicios')
      .select(fields)
      .eq('activo', true)
      .order('categoria')
      .order('orden')
    if (error) throw error
    return NextResponse.json({ tarifas: data || [], role: usuario.rol, canEdit })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo cargar la tarifa' }, { status: statusFor(error) })
  }
}

export async function POST(request: Request) {
  try {
    const { usuario } = await requireAdmin()
    const payload = parsePayload(await request.json())
    const db = adminClient()
    const { data, error } = await db
      .from('tarifas_servicios')
      .insert({ ...payload, codigo: await nextCode(payload.categoria as TarifaCategoria), orden: 9999 })
      .select('*')
      .single()
    if (error) throw error
    await Promise.all([
      db.from('tarifas_historial').insert({ tarifa_id: data.id, usuario_id: usuario.id, usuario: usuario.nombre, accion: 'crear', datos_nuevos: data }),
      db.from('auditoria_core').insert({ usuario: usuario.nombre, usuario_id: usuario.id, modulo: 'tarifas', accion: 'crear', descripcion: `Nueva tarifa: ${data.servicio}`, entidad: 'tarifas_servicios', entidad_id: data.id, metadata: { categoria: data.categoria, pvp: data.pvp } }),
    ])
    return NextResponse.json({ tarifa: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la tarifa'
    return NextResponse.json({ error: message }, { status: message === 'No autorizado' ? 403 : 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const { usuario } = await requireAdmin()
    const body = await request.json() as Record<string, unknown>
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Falta la tarifa que quieres editar' }, { status: 400 })
    const payload = parsePayload(body)
    const db = adminClient()
    const { data: before, error: beforeError } = await db.from('tarifas_servicios').select('*').eq('id', id).single()
    if (beforeError) throw beforeError
    const { data, error } = await db.from('tarifas_servicios').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    await Promise.all([
      db.from('tarifas_historial').insert({ tarifa_id: id, usuario_id: usuario.id, usuario: usuario.nombre, accion: data.activo ? 'editar' : 'desactivar', datos_anteriores: before, datos_nuevos: data }),
      db.from('auditoria_core').insert({ usuario: usuario.nombre, usuario_id: usuario.id, modulo: 'tarifas', accion: 'editar', descripcion: `Tarifa actualizada: ${data.servicio}`, entidad: 'tarifas_servicios', entidad_id: id, metadata: { pvp_anterior: before.pvp, pvp_nuevo: data.pvp } }),
    ])
    return NextResponse.json({ tarifa: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar la tarifa'
    return NextResponse.json({ error: message }, { status: message === 'No autorizado' ? 403 : 400 })
  }
}
