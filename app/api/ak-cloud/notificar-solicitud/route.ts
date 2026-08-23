import { NextResponse } from 'next/server'
import { sendWhatsAppNotification } from '@/lib/whatsapp'
import { sendNotificationEmail } from '@/lib/email'

// POST /api/ak-cloud/notificar-solicitud
// Ruta pequeña y sin autenticación de staff (la llama el propio formulario
// público de registro justo después de crear la solicitud) — solo manda
// WhatsApp y email, nada sensible. body: { empresa, nombre, email, ciudad?, especialidad? }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const empresa = String(body.empresa || '').trim()
    const nombre = String(body.nombre || '').trim()
    const email = String(body.email || '').trim()
    if (!empresa || !nombre) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    // El aviso en el centro de notificaciones (y el push real) ya lo dispara
    // solo el trigger trg_akcore_notify_distributor_request en cuanto se
    // insertó la solicitud en akcloud_solicitudes_distribuidores — insertar
    // aquí también lo duplicaba en el centro de avisos. Lo que sí falta
    // cubrir aquí es WhatsApp y email, que el trigger no manda.
    await sendWhatsAppNotification(
      `🆕 Nueva solicitud AK Cloud\n${empresa} (${nombre})${email ? `\n${email}` : ''}${body.ciudad ? `\nCiudad: ${body.ciudad}` : ''}${body.especialidad ? `\nEspecialidad: ${body.especialidad}` : ''}\n\nRevisar: /ak-cloud/solicitudes`
    )

    if (process.env.STAFF_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.STAFF_NOTIFICATION_EMAIL,
        subject: `Nueva solicitud de distribuidor: ${empresa}`,
        title: 'Nueva solicitud de distribuidor',
        bodyHtml: `<b>${empresa}</b> (${nombre}${email ? `, ${email}` : ''}) ha solicitado acceso como distribuidor.${body.ciudad ? `<br>Ciudad: ${body.ciudad}` : ''}${body.especialidad ? `<br>Especialidad: ${body.especialidad}` : ''}`,
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
