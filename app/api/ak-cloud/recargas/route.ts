import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const ESTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado', 'cancelado']

// GET /api/ak-cloud/recargas?estado=pendiente
export async function GET(request: Request) {
  try {
    await requireStaff()
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    const admin = adminClient()
    let query = admin.from('ak_creditos_recargas').select('*').order('created_at', { ascending: false })
    if (estado && estado !== 'todos') query = query.eq('estado', estado)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ recargas: data || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando recargas' }, { status })
  }
}

// POST /api/ak-cloud/recargas — aprobar o rechazar una recarga
// body: { id, estado: 'aprobada' | 'rechazada' | 'cancelada', notas_admin? }
// Al aprobar, crea el movimiento de crédito real y notifica al distribuidor.
// Esta es la ÚNICA vía pensada para dar de alta créditos — así el saldo de
// un distribuidor nunca depende de una escritura hecha desde su propio navegador.
export async function POST(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const id = String(body.id || '')
    const estado = String(body.estado || '')
    if (!id || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: recarga, error: fetchError } = await admin
      .from('ak_creditos_recargas')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError
    if (recarga.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Esta recarga ya fue procesada' }, { status: 409 })
    }

    const { error: updateError } = await admin
      .from('ak_creditos_recargas')
      .update({
        estado,
        notas_admin: body.notas_admin ?? recarga.notas_admin ?? null,
        aprobada_por: usuario.nombre,
        aprobada_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (updateError) throw updateError

    if (estado === 'aprobado' && recarga.user_id) {
      const { data: last } = await admin
        .from('ak_creditos_movimientos')
        .select('saldo_resultante')
        .eq('user_id', recarga.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const saldoAnterior = Number(last?.saldo_resultante || 0)
      const saldoNuevo = saldoAnterior + Number(recarga.creditos || 0)

      await admin.from('ak_creditos_movimientos').insert({
        user_id: recarga.user_id,
        tipo: 'recarga',
        concepto: `Recarga aprobada (${recarga.metodo_pago || 'manual'})`,
        creditos: recarga.creditos,
        saldo_resultante: saldoNuevo,
      })

      await admin.from('file_service_notificaciones').insert({
        user_id: recarga.user_id,
        titulo: 'Recarga de créditos aprobada',
        mensaje: `Se han añadido ${recarga.creditos} créditos a tu saldo.`,
        tipo: 'success',
      })
    } else if (estado === 'rechazado' && recarga.user_id) {
      await admin.from('file_service_notificaciones').insert({
        user_id: recarga.user_id,
        titulo: 'Recarga de créditos rechazada',
        mensaje: body.notas_admin || 'Tu recarga no ha podido confirmarse. Contacta con soporte si crees que es un error.',
        tipo: 'error',
      })
    }

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'ak_cloud',
      accion: `recarga_${estado}`,
      entidad: 'ak_creditos_recargas',
      entidad_id: id,
      metadata: { creditos: recarga.creditos, user_id: recarga.user_id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error procesando recarga' }, { status })
  }
}
