import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, serviceKey)

function esc(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fecha(value: any) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    const print = req.nextUrl.searchParams.get('print') === '1'

    const { data: garantia, error } = await supabase
      .from('garantias_expediente')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!garantia) return new NextResponse('Garantía no encontrada', { status: 404 })

    const [{ data: expediente }, { data: empresa }] = await Promise.all([
      supabase.from('expedientes').select('*').eq('id', garantia.expediente_id).maybeSingle(),
      supabase.from('configuracion_empresa').select('*').limit(1).maybeSingle(),
    ])

    const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
      expediente?.cliente_id
        ? supabase.from('clientes').select('*').eq('id', expediente.cliente_id).maybeSingle()
        : Promise.resolve({ data: null }),
      expediente?.vehiculo_id
        ? supabase.from('vehiculos').select('*').eq('id', expediente.vehiculo_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const titulo = esc(garantia.titulo || 'Garantía de servicio')
    const numeroOt = esc(expediente?.numero_ot || expediente?.id?.slice(0, 8) || '—')
    const empresaNombre = esc(empresa?.nombre_comercial || empresa?.razon_social || 'Autokeys Lab')
    const condiciones = esc(garantia.condiciones || empresa?.condiciones_garantia || 'Garantía según condiciones del servicio realizado.')
    const pie = esc(empresa?.pie_garantia || empresa?.pie_factura || 'Documento generado por Autokeys Core.')

    const vehiculoTexto = [vehiculo?.marca, vehiculo?.modelo, vehiculo?.motor]
      .filter(Boolean)
      .join(' ')

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titulo} · ${numeroOt}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; color: #111827; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 24px auto; background: #fff; padding: 20mm; box-shadow: 0 15px 60px rgba(0,0,0,.16); }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #dc2626; padding-bottom: 18px; }
    .brand h1 { margin: 0; font-size: 28px; letter-spacing: -.04em; }
    .brand p, .meta p { margin: 4px 0; color: #4b5563; font-size: 12px; }
    .badge { display: inline-block; background: #dc2626; color: white; padding: 8px 12px; border-radius: 999px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .title { margin-top: 28px; }
    .title h2 { margin: 0; font-size: 26px; }
    .title p { margin: 8px 0 0; color: #4b5563; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .box { border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; }
    .box h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #dc2626; }
    .row { margin: 7px 0; font-size: 13px; }
    .label { color: #6b7280; font-weight: 700; display: inline-block; min-width: 115px; }
    .section { margin-top: 20px; }
    .section h3 { margin: 0 0 10px; font-size: 16px; }
    .text { white-space: pre-wrap; line-height: 1.55; color: #374151; font-size: 13px; }
    .signature { min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #cbd5e1; border-radius: 16px; margin-top: 12px; }
    .signature img { max-height: 100px; max-width: 100%; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 11px; line-height: 1.45; }
    .actions { position: fixed; right: 24px; top: 24px; display: flex; gap: 8px; }
    .actions button { border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 800; color: white; background: #dc2626; cursor: pointer; }
    @media print {
      body { background: white; }
      .page { margin: 0; width: auto; min-height: auto; box-shadow: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Imprimir / PDF</button>
  </div>
  <main class="page">
    <header class="top">
      <div class="brand">
        <h1>${empresaNombre}</h1>
        <p>${esc(empresa?.direccion || '')}</p>
        <p>${esc(empresa?.telefono || '')} · ${esc(empresa?.email || '')}</p>
        <p>${esc(empresa?.web || '')}</p>
      </div>
      <div class="meta">
        <span class="badge">Garantía</span>
        <p><strong>OT:</strong> ${numeroOt}</p>
        <p><strong>Fecha:</strong> ${fecha(garantia.generado_at || garantia.created_at)}</p>
        <p><strong>Generado por:</strong> ${esc(garantia.generado_por || 'Autokeys Core')}</p>
      </div>
    </header>

    <section class="title">
      <h2>${titulo}</h2>
      <p>Justificante asociado al expediente ${numeroOt}.</p>
    </section>

    <section class="grid">
      <div class="box">
        <h3>Cliente / receptor</h3>
        <div class="row"><span class="label">Cliente:</span> ${esc(cliente?.nombre || garantia.receptor_nombre || '—')}</div>
        <div class="row"><span class="label">Teléfono:</span> ${esc(cliente?.telefono || '—')}</div>
        <div class="row"><span class="label">NIF/DNI:</span> ${esc(cliente?.nif || garantia.receptor_dni || '—')}</div>
        <div class="row"><span class="label">Receptor:</span> ${esc(garantia.receptor_nombre || '—')}</div>
      </div>
      <div class="box">
        <h3>Vehículo</h3>
        <div class="row"><span class="label">Vehículo:</span> ${esc(vehiculoTexto || '—')}</div>
        <div class="row"><span class="label">Matrícula:</span> ${esc(vehiculo?.matricula || '—')}</div>
        <div class="row"><span class="label">VIN:</span> ${esc(vehiculo?.bastidor || '—')}</div>
        <div class="row"><span class="label">ECU:</span> ${esc(vehiculo?.ecu || '—')}</div>
      </div>
    </section>

    <section class="section box">
      <h3>Trabajo realizado</h3>
      <div class="text">${esc(garantia.trabajo_realizado || expediente?.descripcion || expediente?.tipo_trabajo || 'Servicio realizado por Autokeys Lab.')}</div>
    </section>

    <section class="section box">
      <h3>Condiciones de garantía</h3>
      <div class="text">${condiciones}</div>
    </section>

    <section class="grid">
      <div class="box">
        <h3>Observaciones</h3>
        <div class="text">${esc(garantia.observaciones || 'Sin observaciones.')}</div>
      </div>
      <div class="box">
        <h3>Firma / entrega</h3>
        <div class="signature">${garantia.firma_url ? `<img src="${esc(garantia.firma_url)}" alt="Firma" />` : 'Sin firma vinculada'}</div>
      </div>
    </section>

    <footer class="footer">${pie}</footer>
  </main>
  ${print ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 400))</script>' : ''}
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error: any) {
    return new NextResponse(error?.message || 'No se pudo generar la garantía', { status: 500 })
  }
}
