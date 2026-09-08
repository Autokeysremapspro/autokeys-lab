import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'
import { buildReceptionPdf } from '@/lib/recepcion-pdf'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const [{ data: expediente }, { data: recepcion }, { data: empresa }] = await Promise.all([
      db.from('expedientes').select('*').eq('id', params.id).single(),
      db.from('recepciones_ot').select('*').eq('expediente_id', params.id).single(),
      db.from('configuracion_empresa').select('*').limit(1).maybeSingle(),
    ])
    if (!expediente || !recepcion) return NextResponse.json({ error: 'Recepción no encontrada' }, { status: 404 })
    const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
      expediente.cliente_id ? db.from('clientes').select('*').eq('id', expediente.cliente_id).single() : Promise.resolve({ data: null }),
      expediente.vehiculo_id ? db.from('vehiculos').select('*').eq('id', expediente.vehiculo_id).single() : Promise.resolve({ data: null }),
    ])
    const pdf = buildReceptionPdf({ expediente, recepcion, cliente, vehiculo, empresa })
    return new NextResponse(new Uint8Array(pdf), { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${expediente.numero_ot || 'orden-trabajo'}.pdf"` } })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
