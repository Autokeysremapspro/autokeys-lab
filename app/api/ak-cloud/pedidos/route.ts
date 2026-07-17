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
    const { data: pedidoAntes } = await admin
      .from('file_service_pedidos')
      .select('estado')
      .eq('id', id)
      .maybeSingle()
    const yaEstabaCancelado = pedidoAntes?.estado === 'cancelado'

    const { data: pedido, error } = await admin
      .from('file_service_pedidos')
      .update(payload)
      .eq('id', id)
      .select('id, user_id, numero, estado, cliente_email, cliente_nombre')
      .single()
    if (error) throw error

    // Si se cancela un pedido que ya había descontado créditos, se devuelven.
    // Sin esto, cancelar un pedido significaba cobrar por un trabajo que
    // nunca se hizo — justo el problema inverso al que ya se corrigió al
    // crear el pedido.
    if (body.estado === 'cancelado' && !yaEstabaCancelado && pedido.user_id) {
      const { data: consumo } = await admin
        .from('ak_creditos_movimientos')
        .select('creditos')
        .eq('pedido_id', id)
        .eq('tipo', 'consumo')
        .maybeSingle()

      const creditosADevolver = Math.abs(Number(consumo?.creditos || 0))
      if (creditosADevolver > 0) {
        const { data: last } = await admin
          .from('ak_creditos_movimientos')
          .select('saldo_resultante')
          .eq('user_id', pedido.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const saldoActual = Number(last?.saldo_resultante || 0)

        await admin.from('ak_creditos_movimientos').insert({
          user_id: pedido.user_id,
          tipo: 'devolucion',
          concepto: `Devolución por cancelación de pedido ${pedido.numero || id}`,
          pedido_id: id,
          creditos: creditosADevolver,
          saldo_resultante: saldoActual + creditosADevolver,
        })
      }
    }

    // Notifica al distribuidor del cambio de estado (misma base de datos que AK Cloud)
    if (pedido?.user_id && body.estado) {
      const ESTADO_LABELS: Record<string, string> = {
        pendiente: 'pendiente',
        en_proceso: 'en proceso en el laboratorio',
        finalizado: 'finalizado — ya puedes descargarlo',
        cancelado: 'cancelado',
      }
      const mensaje = `Tu pedido ha pasado a estado: ${body.estado}.`

      await admin.from('file_service_notificaciones').insert({
        user_id: pedido.user_id,
        titulo: `Pedido ${pedido.numero || ''} actualizado`,
        mensaje,
        tipo: body.estado === 'finalizado' ? 'success' : 'info',
      })

      await sendNotificationEmail({
        to: pedido.cliente_email,
        subject: `Pedido ${pedido.numero || ''} — ${ESTADO_LABELS[body.estado] || body.estado}`,
        title: `Tu pedido está ${ESTADO_LABELS[body.estado] || body.estado}`,
        bodyHtml: `Hola ${pedido.cliente_nombre || ''},<br><br>Tu pedido <b>${pedido.numero || ''}</b> ha cambiado de estado: <b>${ESTADO_LABELS[body.estado] || body.estado}</b>.`,
        ctaHref: process.env.NEXT_PUBLIC_AKCLOUD_URL ? `${process.env.NEXT_PUBLIC_AKCLOUD_URL}/pedidos` : undefined,
        ctaLabel: 'Ver mis pedidos',
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
