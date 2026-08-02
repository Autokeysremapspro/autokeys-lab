import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppNotification } from '@/lib/whatsapp'
import { sendNotificationEmail } from '@/lib/email'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function escHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// POST /api/ak-cloud/notificar-solicitud
// Ruta pequeña y sin autenticación de staff (la llama el propio formulario
// público de registro justo después de crear la solicitud) — solo hace un
// insert de notificación interna + email, nada sensible. body: { empresa, nombre, email, ciudad?, especialidad? }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const empresa = String(body.empresa || '').trim()
    const nombre = String(body.nombre || '').trim()
    const email = String(body.email || '').trim()
    const solicitudId = String(body.solicitud_id || '').trim()
    if (!empresa || !nombre || !solicitudId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const admin = adminClient()
    const { data: solicitud, error: solicitudError } = await admin
      .from('akcloud_solicitudes_distribuidores')
      .select('id,empresa,nombre,email,ciudad,especialidad,created_at')
      .eq('id', solicitudId)
      .maybeSingle()

    if (solicitudError || !solicitud) return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 })
    if (solicitud.empresa !== empresa || solicitud.nombre !== nombre || (solicitud.email || '') !== email) {
      return NextResponse.json({ error: 'Los datos no coinciden con la solicitud' }, { status: 400 })
    }

    const createdAt = new Date(solicitud.created_at).getTime()
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > 15 * 60 * 1000) {
      return NextResponse.json({ error: 'Solicitud caducada' }, { status: 400 })
    }

    const marker = `[solicitud:${solicitudId}]`
    const { data: alreadySent } = await admin.from('notificaciones').select('id').ilike('mensaje', `%${marker}%`).limit(1).maybeSingle()
    if (alreadySent) return NextResponse.json({ ok: true, duplicate: true })

    await admin.from('notificaciones').insert({
      usuario_id: null,
      titulo: 'Nueva solicitud de distribuidor AK Cloud',
      mensaje: `${empresa} (${nombre}) ha solicitado acceso como distribuidor. ${marker}`,
      modulo: 'ak_cloud',
      tipo: 'info',
      prioridad: 'normal',
      href: '/ak-cloud/solicitudes',
      accion_texto: 'Revisar solicitud',
    })

    await sendWhatsAppNotification(
      `🆕 Nueva solicitud AK Cloud\n${empresa} (${nombre})${email ? `\n${email}` : ''}${body.ciudad ? `\nCiudad: ${body.ciudad}` : ''}${body.especialidad ? `\nEspecialidad: ${body.especialidad}` : ''}\n\nRevisar: /ak-cloud/solicitudes`
    )

    if (process.env.STAFF_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.STAFF_NOTIFICATION_EMAIL,
        subject: `Nueva solicitud de distribuidor: ${empresa}`,
        title: 'Nueva solicitud de distribuidor',
        bodyHtml: `<b>${escHtml(empresa)}</b> (${escHtml(nombre)}${email ? `, ${escHtml(email)}` : ''}) ha solicitado acceso como distribuidor.${solicitud.ciudad ? `<br>Ciudad: ${escHtml(solicitud.ciudad)}` : ''}${solicitud.especialidad ? `<br>Especialidad: ${escHtml(solicitud.especialidad)}` : ''}`,
        ctaHref: '/ak-cloud/solicitudes',
        ctaLabel: 'Revisar solicitud',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    // Best-effort: un fallo aquí no debe impedir que el registro se complete.
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
  }
}
