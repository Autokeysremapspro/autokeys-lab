import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppNotification } from '@/lib/whatsapp'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
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
    if (!empresa || !nombre) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const admin = adminClient()
    await admin.from('notificaciones').insert({
      usuario_id: null,
      titulo: 'Nueva solicitud de distribuidor AK Cloud',
      mensaje: `${empresa} (${nombre}) ha solicitado acceso como distribuidor.`,
      modulo: 'ak_cloud',
      tipo: 'info',
      prioridad: 'normal',
      href: '/ak-cloud/solicitudes',
      accion_texto: 'Revisar solicitud',
    })

    await sendWhatsAppNotification(
      `🆕 Nueva solicitud AK Cloud\n${empresa} (${nombre})${email ? `\n${email}` : ''}${body.ciudad ? `\nCiudad: ${body.ciudad}` : ''}${body.especialidad ? `\nEspecialidad: ${body.especialidad}` : ''}\n\nRevisar: /ak-cloud/solicitudes`
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    // Best-effort: un fallo aquí no debe impedir que el registro se complete.
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
  }
}
