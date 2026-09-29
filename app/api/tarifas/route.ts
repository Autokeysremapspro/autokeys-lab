import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin, requireStaff } from '@/lib/supabase/server'
import { TARIFA_CATEGORIAS, type TarifaCategoria } from '@/types/tarifas'

const EDITABLE_FIELDS = [
  'categoria', 'familia', 'marca', 'modelo', 'anios', 'motor', 'sistema', 'ecu', 'combustible',
  'acceso', 'transponder', 'espadin', 'situacion', 'servicio', 'descripcion', 'pvp',
  'precio_minimo', 'precio_taller', 'incluye', 'condiciones', 'plazo', 'requiere_laboratorio', 'activo',
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

function parsePayload(body: Record<string, unknown>) {
  const categoria = String(body.categoria || '') as TarifaCategoria
  if (!TARIFA_CATEGORIAS.includes(categoria)) throw new Error('La categoría no es válida')
  const servicio = cleanText(body.servicio)
  if (!servicio) throw new Error('El nombre del servicio es obligatorio')

  const payload: Record<string, string | number | boolean | null> = {
    categoria,
    servicio,
    pvp: cleanPrice(body.pvp, true) as number,
    precio_minimo: cleanPrice(body.precio_minimo),
    precio_taller: cleanPrice(body.precio_taller),
    requiere_laboratorio: Boolean(body.requiere_laboratorio),
    activo: body.activo !== false,
  }

  for (const field of EDITABLE_FIELDS) {
    if (field in payload || field === 'pvp' || field === 'precio_minimo' || field === 'precio_taller') continue
    payload[field] = cleanText(body[field])
  }
  return payload
}

async function nextCode(category: TarifaCategoria) {
  const prefix: Record<TarifaCategoria, string> = { llaves: 'LLA', ecus: 'ECU', reparaciones: 'REP', talleres: 'TAL', files: 'FIL' }
  return `${prefix[category]}-N${Date.now().toString(36).toUpperCase()}`
}

export async function GET() {
  try {
    const { usuario } = await requireStaff()
    const canEdit = usuario.rol === 'admin'
    const fields = canEdit ? '*' : 'id,codigo,categoria,familia,marca,modelo,anios,motor,sistema,ecu,combustible,acceso,transponder,espadin,situacion,servicio,descripcion,pvp,precio_taller,incluye,condiciones,plazo,requiere_laboratorio,activo,orden,created_at,updated_at'
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
