import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { requireStaff } from '@/lib/supabase/server'
import { buildReceptionPdf } from '@/lib/recepcion-pdf'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const [{ data: expediente }, { data: recepcion }, { data: empresa }] = await Promise.all([
      db.from('expedientes').select('*').eq('id', params.id).single(),
      db.from('recepciones_ot').select('*').eq('expediente_id', params.id).single(),
      db.from('configuracion_empresa').select('*').limit(1).maybeSingle(),
    ])
    if (!expediente || !recepcion) {
      return NextResponse.json({ error: 'Recepción no encontrada' }, { status: 404 })
    }

    const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
      db.from('clientes').select('*').eq('id', expediente.cliente_id).single(),
      expediente.vehiculo_id
        ? db.from('vehiculos').select('*').eq('id', expediente.vehiculo_id).single()
        : Promise.resolve({ data: null }),
    ])
    if (!cliente?.email) {
      return NextResponse.json({ error: 'El cliente no tiene email registrado' }, { status: 422 })
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'El envío de email no está configurado' }, { status: 503 })
    }

    const pdf = buildReceptionPdf({ expediente, recepcion, cliente, vehiculo, empresa })
    const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM || 'Autokeys Remaps Pro <notificaciones@autokeysremapspro.com>',
      to: cliente.email,
      subject: `Copia de la orden de trabajo ${expediente.numero_ot || ''}`,
      html: `<p>Hola ${cliente.nombre},</p><p>Adjuntamos la copia de la orden de trabajo y justificante de depósito.</p><p>Cualquier intervención adicional requerirá presupuesto o autorización previa.</p>`,
      attachments: [{ filename: `${expediente.numero_ot || 'orden-trabajo'}.pdf`, content: pdf }],
    })
    if (sendError) throw new Error(sendError.message)

    await db.from('recepciones_ot').update({ pdf_enviado_at: new Date().toISOString() }).eq('id', recepcion.id)
    return NextResponse.json({ ok: true, sent: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No se pudo enviar' }, { status: 500 })
  }
}
