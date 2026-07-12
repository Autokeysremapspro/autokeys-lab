import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const ESTADOS_VALIDOS = ['pendiente', 'en_proceso', 'finalizado', 'cancelado']

// GET /api/ak-cloud/pedidos?estado=pendiente — listado para el panel de Core
export async function GET(request: Request) {
  try {
    await requireStaff()
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    const admin = adminClient()
    let query = admin.from('file_service_pedidos').select('*').order('created_at', { ascending: false })
    if (estado && estado !== 'todos') query = query.eq('estado', estado)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ pedidos: data || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando pedidos' }, { status })
  }
}

// POST /api/ak-cloud/pedidos — cambia estado / añade notas / marca como finalizado
// body: { id, estado?, notas_internas?, mod_bucket?, mod_path?, mod_nombre? }
export async function POST(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Falta id de pedido' }, { status: 400 })

    const payload: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.estado)) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
      }
      payload.estado = body.estado
    }
    if (body.notas_internas !== undefined) payload.notas_internas = String(body.notas_internas).slice(0, 4000)
    if (body.mod_bucket !== undefined) payload.mod_bucket = body.mod_bucket
    if (body.mod_path !== undefined) payload.mod_path = body.mod_path
    if (body.mod_nombre !== undefined) payload.mod_nombre = body.mod_nombre

    const admin = adminClient()
    const { data: pedido, error } = await admin
      .from('file_service_pedidos')
      .update(payload)
      .eq('id', id)
      .select('id, user_id, numero, estado')
      .single()
    if (error) throw error

    // Notifica al distribuidor del cambio de estado (misma base de datos que AK Cloud)
    if (pedido?.user_id && body.estado) {
      await admin.from('file_service_notificaciones').insert({
        user_id: pedido.user_id,
        titulo: `Pedido ${pedido.numero || ''} actualizado`,
        mensaje: `Tu pedido ha pasado a estado: ${body.estado}.`,
        tipo: body.estado === 'finalizado' ? 'success' : 'info',
      })
    }

    // Auditoría en Core: queda constancia de qué miembro del staff hizo el cambio
    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'ak_cloud',
      accion: 'actualizar_pedido',
      entidad: 'file_service_pedidos',
      entidad_id: id,
      metadata: payload,
    })

    return NextResponse.json({ ok: true, pedido })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error actualizando pedido' }, { status })
  }
}
