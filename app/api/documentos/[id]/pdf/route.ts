import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await params
  const admin = createClient(supabaseUrl, serviceRole)

  const { data: factura, error } = await admin
    .from('facturas')
    .select('*, clientes(*)')
    .eq('id', id)
    .single()

  if (error || !factura) {
    return NextResponse.json({ error: error?.message || 'Documento no encontrado' }, { status: 404 })
  }

  const { data: lineas } = await admin
    .from('lineas_factura')
    .select('*')
    .eq('factura_id', id)
    .order('created_at', { ascending: true })

  const { data: config } = await admin
    .from('configuracion_empresa')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(factura.numero_documento || 'Documento')}</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;color:#111827}.top{display:flex;justify-content:space-between;gap:30px;border-bottom:4px solid #dc2626;padding-bottom:20px}.brand{font-size:28px;font-weight:800}.muted{color:#6b7280;font-size:13px;line-height:1.5}.badge{display:inline-block;background:#dc2626;color:white;padding:7px 12px;border-radius:999px;font-weight:700;text-transform:uppercase}.box{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-top:24px}table{width:100%;border-collapse:collapse;margin-top:24px}th{text-align:left;background:#111827;color:white;padding:12px;font-size:13px}td{border-bottom:1px solid #e5e7eb;padding:12px;font-size:13px}.totals{margin-left:auto;margin-top:24px;width:320px}.totals div{display:flex;justify-content:space-between;padding:8px 0}.grand{font-size:20px;font-weight:800;border-top:2px solid #111827}.footer{margin-top:50px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#6b7280;white-space:pre-wrap}
</style>
</head>
<body>
  <div class="top">
    <div>
      <div class="brand">${esc(config?.nombre_comercial || 'Autokeys Lab')}</div>
      <div class="muted">${esc(config?.razon_social)}<br>${esc(config?.cif)}<br>${esc(config?.direccion)}<br>${esc(config?.codigo_postal)} ${esc(config?.poblacion)} ${esc(config?.provincia)}<br>${esc(config?.telefono)} · ${esc(config?.email)}<br>${esc(config?.web)}</div>
    </div>
    <div style="text-align:right">
      <div class="badge">${esc(factura.tipo_documento || 'documento')}</div>
      <h2>${esc(factura.numero_documento)}</h2>
      <div class="muted">Fecha: ${esc(factura.fecha)}<br>Estado: ${esc(factura.estado)}</div>
    </div>
  </div>
  <div class="box">
    <strong>Cliente</strong><br>
    ${esc(factura.clientes?.nombre)}<br>
    <span class="muted">${esc(factura.clientes?.nif)}<br>${esc(factura.clientes?.direccion)}<br>${esc(factura.clientes?.telefono)} ${esc(factura.clientes?.email)}</span>
  </div>
  <table>
    <thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead>
    <tbody>
      ${(lineas || []).map((l:any) => `<tr><td>${esc(l.concepto)}<br><span class="muted">${esc(l.descripcion)}</span></td><td>${esc(l.cantidad || 0)}</td><td>${money(l.precio_unitario)}</td><td>${money(l.total)}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><strong>${money(factura.subtotal)}</strong></div>
    <div><span>IVA ${factura.iva_porcentaje || 0}%</span><strong>${money(factura.iva_importe)}</strong></div>
    <div class="grand"><span>Total</span><span>${money(factura.total)}</span></div>
  </div>
  <div class="footer">${esc(config?.texto_pie_factura)}</div>
</body></html>`

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}
