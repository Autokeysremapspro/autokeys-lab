import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function money(value: number | string | null | undefined) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(n)
}

function safe(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function date(value?: string | null) {
  if (!value) return new Date().toLocaleDateString('es-ES')
  return new Date(value).toLocaleDateString('es-ES')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: factura, error: facturaError } = await admin
      .from('facturas')
      .select('*')
      .eq('id', params.id)
      .single()

    if (facturaError || !factura) {
      return NextResponse.json(
        { error: facturaError?.message || 'Documento no encontrado' },
        { status: 404 }
      )
    }

    const [{ data: cliente }, { data: lineas }, { data: config }] = await Promise.all([
      factura.cliente_id
        ? admin.from('clientes').select('*').eq('id', factura.cliente_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      admin
        .from('lineas_factura')
        .select('*')
        .eq('factura_id', factura.id)
        .order('created_at', { ascending: true }),
      admin
        .from('configuracion_empresa')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const empresa = config || {}
    const rows = lineas || []
    const tipo = safe(factura.tipo_documento || 'factura').toUpperCase()
    const numero = safe(factura.numero_documento || factura.numero_factura || 'SIN-NUMERO')
    const estado = safe(factura.estado || 'pendiente')

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${tipo} ${numero}</title>
<style>
  :root { --red:#dc2626; --dark:#111827; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#111827; background:#f3f4f6; }
  .toolbar { position: sticky; top:0; display:flex; justify-content:space-between; gap:12px; padding:14px 24px; background:#111827; color:white; z-index:10; }
  .toolbar button { border:0; border-radius:10px; background:var(--red); color:white; padding:10px 16px; font-weight:700; cursor:pointer; }
  .page { width:210mm; min-height:297mm; margin:24px auto; background:white; padding:18mm; box-shadow:0 20px 60px rgba(0,0,0,.15); }
  .header { display:flex; justify-content:space-between; gap:32px; border-bottom:4px solid var(--red); padding-bottom:22px; }
  .brand h1 { margin:0; font-size:30px; letter-spacing:.5px; }
  .brand p { margin:5px 0; color:var(--muted); font-size:13px; }
  .doc-title { text-align:right; }
  .doc-title h2 { margin:0; color:var(--red); font-size:28px; }
  .doc-title p { margin:6px 0; color:var(--muted); font-size:13px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:28px; }
  .box { border:1px solid var(--line); border-radius:16px; padding:16px; }
  .box h3 { margin:0 0 12px; font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:var(--red); }
  .box p { margin:5px 0; font-size:13px; }
  table { width:100%; border-collapse:collapse; margin-top:30px; }
  th { text-align:left; background:#111827; color:white; font-size:12px; padding:12px; }
  td { padding:12px; border-bottom:1px solid var(--line); font-size:13px; vertical-align:top; }
  .num { text-align:right; white-space:nowrap; }
  .totals { margin-left:auto; margin-top:24px; width:320px; }
  .totals div { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--line); font-size:14px; }
  .totals .grand { font-size:22px; font-weight:800; color:var(--red); border-bottom:0; padding-top:14px; }
  .notes { margin-top:34px; border-top:1px solid var(--line); padding-top:18px; color:#4b5563; font-size:12px; line-height:1.55; }
  .footer { position:fixed; bottom:10mm; left:18mm; right:18mm; color:#6b7280; font-size:10px; text-align:center; }
  @media print { body { background:white; } .toolbar { display:none; } .page { margin:0; width:auto; min-height:auto; box-shadow:none; padding:14mm; } .footer { position:fixed; } }
</style>
</head>
<body>
  <div class="toolbar">
    <strong>Autokeys Core · Vista PDF</strong>
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <main class="page">
    <section class="header">
      <div class="brand">
        <h1>${safe(empresa.nombre_comercial || empresa.razon_social || 'AUTOKEYS LAB')}</h1>
        <p>${safe(empresa.razon_social || '')}</p>
        <p>${safe(empresa.cif || empresa.nif || '')}</p>
        <p>${safe(empresa.direccion || '')} ${safe(empresa.codigo_postal || '')} ${safe(empresa.poblacion || '')}</p>
        <p>${safe(empresa.telefono || '')} · ${safe(empresa.email || '')}</p>
        <p>${safe(empresa.web || '')}</p>
      </div>
      <div class="doc-title">
        <h2>${tipo}</h2>
        <p><strong>${numero}</strong></p>
        <p>Fecha: ${date(factura.fecha || factura.created_at)}</p>
        <p>Estado: ${estado}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h3>Cliente</h3>
        <p><strong>${safe(cliente?.nombre || 'Cliente no indicado')}</strong></p>
        <p>${safe(cliente?.nif || '')}</p>
        <p>${safe(cliente?.direccion || '')}</p>
        <p>${safe(cliente?.codigo_postal || '')} ${safe(cliente?.poblacion || '')} ${safe(cliente?.provincia || '')}</p>
        <p>${safe(cliente?.telefono || '')} ${cliente?.email ? '· ' + safe(cliente.email) : ''}</p>
      </div>
      <div class="box">
        <h3>Documento</h3>
        <p>Tipo: <strong>${tipo}</strong></p>
        <p>Número: <strong>${numero}</strong></p>
        <p>IVA: ${safe(factura.iva_porcentaje ?? 21)}%</p>
        <p>Forma de pago: ${safe(factura.metodo_pago || 'No indicada')}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="num">Cantidad</th>
          <th class="num">Precio</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((linea: any) => `
          <tr>
            <td><strong>${safe(linea.concepto)}</strong>${linea.descripcion ? `<br><span style="color:#6b7280">${safe(linea.descripcion)}</span>` : ''}</td>
            <td class="num">${safe(linea.cantidad ?? 1)}</td>
            <td class="num">${money(linea.precio_unitario)}</td>
            <td class="num"><strong>${money(linea.total)}</strong></td>
          </tr>`).join('') : `
          <tr><td colspan="4" style="text-align:center;color:#6b7280;padding:30px">Sin líneas añadidas</td></tr>`}
      </tbody>
    </table>

    <section class="totals">
      <div><span>Subtotal</span><strong>${money(factura.subtotal)}</strong></div>
      <div><span>IVA</span><strong>${money(factura.iva_importe)}</strong></div>
      <div class="grand"><span>Total</span><strong>${money(factura.total)}</strong></div>
    </section>

    <section class="notes">
      <strong>Observaciones</strong><br>
      ${safe(factura.notas || empresa.pie_factura || empresa.texto_legal || 'Gracias por confiar en Autokeys Lab.')}
    </section>
  </main>

  <div class="footer">
    Documento generado por Autokeys Core · ${safe(empresa.nombre_comercial || 'Autokeys Lab')}
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'No se pudo generar el documento' },
      { status: 500 }
    )
  }
}
