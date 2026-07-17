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

// GET /api/ak-cloud/distribuidores — solicitudes + planes + distribuidores activos
export async function GET() {
  try {
    await requireStaff()
    const admin = adminClient()
    const [{ data: solicitudes, error }, { data: planes, error: planesError }, { data: distribuidores, error: distError }] =
      await Promise.all([
        admin.from('akcloud_solicitudes_distribuidores').select('*').order('created_at', { ascending: false }),
        admin.from('akcloud_planes').select('*').eq('activo', true).order('orden'),
        admin.from('akcloud_distribuidores').select('*').order('created_at', { ascending: false }),
      ])
    if (error) throw error
    if (planesError) throw planesError
    if (distError) throw distError
    return NextResponse.json({ solicitudes: solicitudes || [], planes: planes || [], distribuidores: distribuidores || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando distribuidores' }, { status })
  }
}

async function findOrCreateCliente(admin: any, solicitud: any) {
  if (solicitud.core_cliente_id) return solicitud.core_cliente_id
  const { data: existing } = await admin.from('clientes').select('id').eq('email', solicitud.email).limit(1).maybeSingle()
  if (existing?.id) return existing.id
  const { data, error } = await admin
    .from('clientes')
    .insert({
      nombre: solicitud.empresa || `${solicitud.nombre} ${solicitud.apellidos || ''}`.trim(),
      email: solicitud.email,
      telefono: solicitud.telefono || null,
      nif: solicitud.nif || null,
      direccion: solicitud.direccion || null,
      codigo_postal: solicitud.codigo_postal || null,
      poblacion: solicitud.ciudad || null,
      provincia: solicitud.provincia || null,
      notas: `Distribuidor AK Cloud. Especialidad: ${solicitud.especialidad || '—'}. Herramientas: ${(solicitud.herramientas || []).join(', ')}`,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// POST /api/ak-cloud/distribuidores — aprobar / rechazar / pedir info / suspender / activar
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const action = String(body.action || '')
    const admin = adminClient()
    if (!id || !['aprobar', 'rechazar', 'solicitar_informacion', 'suspender', 'activar'].includes(action)) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
    const { data: solicitud, error } = await admin.from('akcloud_solicitudes_distribuidores').select('*').eq('id', id).single()
    if (error) throw error
    const motivo = String(body.motivo || '').trim() || null

    if (action === 'aprobar') {
      const planId = body.plan_id || null
      const creditos = Math.max(0, Number(body.creditos_iniciales || 0))
      const clienteId = await findOrCreateCliente(admin, solicitud)

      if (solicitud.auth_user_id) {
        const plan = planId ? (await admin.from('akcloud_planes').select('slug,nombre').eq('id', planId).maybeSingle()).data : null
        const { error: authError } = await admin.auth.admin.updateUserById(solicitud.auth_user_id, {
          email_confirm: true,
          user_metadata: {
            empresa: solicitud.empresa,
            nombre: `${solicitud.nombre} ${solicitud.apellidos || ''}`.trim(),
            tipo_usuario: 'distribuidor',
            estado_acceso: 'activo',
            plan_slug: plan?.slug || null,
          },
          app_metadata: { rol: 'distribuidor', estado_acceso: 'activo' },
        })
        if (authError) throw authError
      }

      const { error: distError } = await admin.from('akcloud_distribuidores').upsert(
        {
          auth_user_id: solicitud.auth_user_id,
          solicitud_id: solicitud.id,
          core_cliente_id: clienteId,
          plan_id: planId,
          empresa: solicitud.empresa,
          nombre_contacto: `${solicitud.nombre} ${solicitud.apellidos || ''}`.trim(),
          email: solicitud.email,
          telefono: solicitud.telefono || null,
          nif: solicitud.nif || null,
          estado: 'activo',
          aprobado_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_user_id' }
      )
      if (distError) throw distError

      if (creditos > 0 && solicitud.auth_user_id) {
        const { data: last } = await admin
          .from('ak_creditos_movimientos')
          .select('saldo_resultante')
          .eq('user_id', solicitud.auth_user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const saldo = Number(last?.saldo_resultante || 0) + creditos
        await admin.from('ak_creditos_movimientos').insert({
          user_id: solicitud.auth_user_id,
          tipo: 'ajuste',
          concepto: 'Créditos de bienvenida por aprobación',
          creditos,
          saldo_resultante: saldo,
        })
      }

      await admin.from('file_service_notificaciones').insert({
        user_id: solicitud.auth_user_id,
        titulo: 'Cuenta AK Cloud aprobada',
        mensaje: 'Tu cuenta ya está activa. Ya puedes acceder al dashboard.',
        tipo: 'success',
      })

      await sendNotificationEmail({
        to: solicitud.email,
        subject: '¡Tu cuenta AK Cloud ya está activa!',
        title: 'Bienvenido a AK Cloud',
        bodyHtml: `Hola ${solicitud.nombre},<br><br>Tu solicitud como distribuidor de <b>${solicitud.empresa}</b> ha sido aprobada${creditos > 0 ? `, con <b>${creditos} créditos de bienvenida</b>` : ''}. Ya puedes iniciar sesión y empezar a trabajar.`,
        ctaHref: process.env.NEXT_PUBLIC_AKCLOUD_URL ? `${process.env.NEXT_PUBLIC_AKCLOUD_URL}/login` : undefined,
        ctaLabel: 'Iniciar sesión',
      })

      await admin
        .from('akcloud_solicitudes_distribuidores')
        .update({
          estado: 'aprobada',
          motivo_estado: motivo,
          plan_id: planId,
          creditos_iniciales: creditos,
          core_cliente_id: clienteId,
          revisada_por: 'Autokeys Core',
          revisada_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json({ ok: true })
    }

    const estado =
      action === 'rechazar'
        ? 'rechazada'
        : action === 'solicitar_informacion'
        ? 'informacion_solicitada'
        : action === 'suspender'
        ? 'rechazada'
        : 'aprobada'

    await admin
      .from('akcloud_solicitudes_distribuidores')
      .update({ estado, motivo_estado: motivo, revisada_por: 'Autokeys Core', revisada_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (solicitud.auth_user_id) {
      await admin.auth.admin.updateUserById(solicitud.auth_user_id, {
        user_metadata: { estado_acceso: estado },
        app_metadata: { rol: 'distribuidor', estado_acceso: estado },
      })
      await admin.from('file_service_notificaciones').insert({
        user_id: solicitud.auth_user_id,
        titulo: estado === 'rechazada' ? 'Solicitud no aprobada' : 'Información adicional requerida',
        mensaje: motivo || 'Consulta el estado de tu solicitud en AK Cloud.',
        tipo: estado === 'rechazada' ? 'error' : 'info',
      })
    }

    if (estado === 'rechazada') {
      await sendNotificationEmail({
        to: solicitud.email,
        subject: 'Tu solicitud de acceso a AK Cloud',
        title: 'Solicitud no aprobada',
        bodyHtml: `Hola ${solicitud.nombre},<br><br>Tu solicitud como distribuidor de <b>${solicitud.empresa}</b> no ha podido aprobarse.${motivo ? `<br><br><b>Motivo:</b> ${motivo}` : ''}`,
      })
    } else if (estado === 'informacion_solicitada') {
      await sendNotificationEmail({
        to: solicitud.email,
        subject: 'Necesitamos más información para tu solicitud',
        title: 'Información adicional requerida',
        bodyHtml: `Hola ${solicitud.nombre},<br><br>Para continuar con tu solicitud como distribuidor necesitamos más información.${motivo ? `<br><br>${motivo}` : ''}`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error procesando solicitud' }, { status: 500 })
  }
}
