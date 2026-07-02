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

function eur(value: any) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function fecha(value: any) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-ES').format(new Date(value))
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const id = context.params.id
    const print = req.nextUrl.searchParams.get('print') === '1'

    const [{ data: factura, error: facturaError }, { data: config }] = await Promise.all([
      supabase
        .from('facturas')
        .select('*, clientes(*)')
        .eq('id', id)
        .single(),
      supabase
        .from('configuracion_empresa')
        .select('*')
        .limit(1)
        .maybeSingle(),
    ])

    if (facturaError) throw facturaError
    if (!factura) return new NextResponse('Documento no encontrado', { status: 404 })

    const { data: lineas } = await supabase
      .from('lineas_factura')
      .select('*')
      .eq('factura_id', id)
      .order('created_at', { ascending: true })

    const empresa = config || {}
    const cliente = factura.clientes || {}
    const tipo = esc(factura.tipo_documento || 'documento').toUpperCase()
    const numero = esc(factura.numero_documento || 'Sin número')

    const rows = (lineas || []).map((linea: any) => `
      <tr>
        <td>${esc(linea.concepto)}</td>
        <td class="center">${esc(linea.cantidad ?? 1)}</td>
        <td class="right">${eur(linea.precio_unitario)}</td>
        <td class="right">${eur(linea.total)}</td>
      </tr>
    `).join('') || `
      <tr>
        <td>Servicio Autokeys Lab</td>
        <td class="center">1</td>
        <td class="right">${eur(factura.subtotal || factura.total)}</td>
        <td class="right">${eur(factura.subtotal || factura.total)}</td>
      </tr>
    `

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${tipo} ${numero}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; color: #111827; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 20px auto; background: white; padding: 22mm; box-shadow: 0 10px 35px rgba(0,0,0,.18); }
    .topbar { display: flex; justify-content: space-between; gap: 28px; align-items: flex-start; border-bottom: 3px solid #dc2626; padding-bottom: 22px; }
    .brand h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; }
    .brand p { margin: 6px 0 0; color: #6b7280; line-height: 1.45; font-size: 13px; }
    .docbox { text-align: right; }
    .docbox .type { color: #dc2626; font-weight: 900; font-size: 28px; letter-spacing: -0.04em; }
    .docbox .num { font-weight: 800; margin-top: 6px; }
    .section { margin-top: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
    .box { border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; }
    .label { color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
    .box strong { display: block; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #111827; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
    td { border-bottom: 1px solid #e5e7eb; padding: 12px; vertical-align: top; }
    .right { text-align: right; }
    .center { text-align: center; }
    .totals { margin-left: auto; width: 310px; margin-top: 20px; }
    .totals div { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e5e7eb; }
    .totals .grand { font-size: 22px; font-weight: 900; border-bottom: 0; color: #dc2626; }
    .notes { margin-top: 34px; color: #4b5563; font-size: 12px; line-height: 1.55; }
    .actions { position: fixed; right: 18px; top: 18px; display: flex; gap: 10px; }
    .actions button { border: 0; background: #dc2626; color: white; padding: 10px 14px; border-radius: 10px; font-weight: 800; cursor: pointer; }
    .actions button.secondary { background: #111827; }
    @media print {
      body { background: white; }
      .page { margin: 0; box-shadow: none; width: auto; min-height: auto; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
    <button class="secondary" onclick="window.close()">Cerrar</button>
  </div>

  <main class="page">
    <div class="topbar">
      <div class="brand">
        <h1>${esc(empresa.nombre_comercial || 'Autokeys Lab')}</h1>
        <p>
          ${esc(empresa.razon_social || '')}<br/>
          ${esc(empresa.cif || '')}<br/>
          ${esc(empresa.direccion || '')} ${esc(empresa.codigo_postal || '')}<br/>
          ${esc(empresa.poblacion || '')} ${esc(empresa.provincia || '')}<br/>
          ${esc(empresa.telefono || '')} · ${esc(empresa.email || '')}<br/>
          ${esc(empresa.web || '')}
        </p>
      </div>
      <div class="docbox">
        <div class="type">${tipo}</div>
        <div class="num">${numero}</div>
        <div style="margin-top:10px;color:#6b7280;">Fecha: ${fecha(factura.fecha || factura.created_at)}</div>
        <div style="margin-top:4px;color:#6b7280;">Estado: ${esc(factura.estado || 'pendiente')}</div>
      </div>
    </div>

    <section class="section grid">
      <div class="box">
        <div class="label">Cliente</div>
        <strong>${esc(cliente.nombre || 'Cliente sin asignar')}</strong>
        <div>${esc(cliente.nif || '')}</div>
        <div>${esc(cliente.direccion || '')}</div>
        <div>${esc(cliente.codigo_postal || '')} ${esc(cliente.poblacion || '')} ${esc(cliente.provincia || '')}</div>
        <div>${esc(cliente.telefono || '')}</div>
        <div>${esc(cliente.email || '')}</div>
      </div>
      <div class="box">
        <div class="label">Documento</div>
        <strong>${numero}</strong>
        <div>Tipo: ${tipo}</div>
        <div>IVA: ${esc(factura.iva_porcentaje ?? empresa.iva_defecto ?? 21)}%</div>
        <div>Notas: ${esc(factura.notas || '')}</div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="center">Cantidad</th>
          <th class="right">Precio</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="totals">
      <div><span>Subtotal</span><strong>${eur(factura.subtotal)}</strong></div>
      <div><span>IVA</span><strong>${eur(factura.iva_importe)}</strong></div>
      <div class="grand"><span>Total</span><span>${eur(factura.total)}</span></div>
    </section>

    <section class="notes">
      <strong>Condiciones / pie legal</strong><br/>
      ${esc(empresa.pie_factura || 'Gracias por confiar en Autokeys Lab.')}
      ${empresa.texto_legal ? `<br/><br/>${esc(empresa.texto_legal)}` : ''}
    </section>
  </main>

  ${print ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300))</script>' : ''}
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    return new NextResponse(error?.message || 'Error generando documento', { status: 500 })
  }
}
