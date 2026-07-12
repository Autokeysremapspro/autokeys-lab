import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'
import { sendNotificationEmail } from '@/lib/email'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const ESTADOS_VALIDOS = ['abierto', 'en_revision', 'respondido', 'cerrado']

// GET /api/ak-cloud/soporte?estado=abierto — listado de tickets para el staff
// GET /api/ak-cloud/soporte?ticket_id=... — hilo de mensajes de un ticket concreto
export async function GET(request: Request) {
  try {
    await requireStaff()
    const { searchParams } = new URL(request.url)
    const admin = adminClient()

    const ticketId = searchParams.get('ticket_id')
    if (ticketId) {
      const { data, error } = await admin
        .from('akcloud_ticket_mensajes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return NextResponse.json({ mensajes: data || [] })
    }

    const estado = searchParams.get('estado')
    let query = admin.from('akcloud_tickets').select('*').order('created_at', { ascending: false })
    if (estado && estado !== 'todos') query = query.eq('estado', estado)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ tickets: data || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando soporte' }, { status })
  }
}

// POST /api/ak-cloud/soporte — responder a un ticket y/o cambiar su estado
// body: { ticket_id, mensaje?, estado? }
export async function POST(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const ticketId = String(body.ticket_id || '')
    if (!ticketId) return NextResponse.json({ error: 'Falta ticket_id' }, { status: 400 })

    const admin = adminClient()
    const { data: ticket, error: fetchError } = await admin
      .from('akcloud_tickets')
      .select('id, user_id, numero')
      .eq('id', ticketId)
      .single()
    if (fetchError) throw fetchError

    if (body.mensaje) {
      const { error: msgError } = await admin.from('akcloud_ticket_mensajes').insert({
        ticket_id: ticketId,
        remitente: usuario.nombre,
        mensaje: String(body.mensaje).slice(0, 8000),
        interno: false,
      })
      if (msgError) throw msgError

      if (ticket.user_id) {
        await admin.from('file_service_notificaciones').insert({
          user_id: ticket.user_id,
          titulo: `Respuesta en tu ticket ${ticket.numero || ''}`,
          mensaje: String(body.mensaje).slice(0, 200),
          tipo: 'info',
        })

        const { data: authUser } = await admin.auth.admin.getUserById(ticket.user_id)
        await sendNotificationEmail({
          to: authUser?.user?.email,
          subject: `Respuesta a tu ticket ${ticket.numero || ''}`,
          title: 'Nueva respuesta de soporte',
          bodyHtml: `Has recibido una respuesta en tu ticket <b>${ticket.numero || ''}</b>:<br><br><em>"${String(body.mensaje).slice(0, 300)}"</em>`,
          ctaHref: process.env.NEXT_PUBLIC_AKCLOUD_URL ? `${process.env.NEXT_PUBLIC_AKCLOUD_URL}/soporte` : undefined,
          ctaLabel: 'Ver ticket',
        })
      }
    }

    if (body.estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(body.estado)) {
        return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
      }
      const { error: updateError } = await admin
        .from('akcloud_tickets')
        .update({ estado: body.estado, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
      if (updateError) throw updateError
    }

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'ak_cloud',
      accion: 'responder_ticket',
      entidad: 'akcloud_tickets',
      entidad_id: ticketId,
      metadata: { estado: body.estado ?? null, con_mensaje: !!body.mensaje },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error respondiendo el ticket' }, { status })
  }
}
