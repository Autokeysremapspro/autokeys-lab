import { supabase } from '@/lib/supabase'
import type { FacturaCobro, MetodoPago, PagoFactura } from '@/types/pagos'

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'otro', label: 'Otro' },
]

export async function getFacturasCobro(): Promise<FacturaCobro[]> {
  const [{ data: facturas, error: facturasError }, { data: clientes, error: clientesError }, { data: pagos, error: pagosError }] = await Promise.all([
    supabase.from('facturas').select('*').order('created_at', { ascending: false }),
    supabase.from('clientes').select('id,nombre'),
    supabase.from('pagos_factura').select('*').order('fecha_pago', { ascending: false }),
  ])

  if (facturasError) throw new Error(facturasError.message)
  if (clientesError) throw new Error(clientesError.message)
  if (pagosError) throw new Error(pagosError.message)

  const clientesMap = new Map((clientes || []).map((c: any) => [c.id, c.nombre]))
  const pagosByFactura = new Map<string, PagoFactura[]>()

  ;(pagos || []).forEach((p: PagoFactura) => {
    const list = pagosByFactura.get(p.factura_id) || []
    list.push(p)
    pagosByFactura.set(p.factura_id, list)
  })

  return (facturas || []).map((factura: any) => {
    const facturaPagos = pagosByFactura.get(factura.id) || []
    const totalPagado = facturaPagos.reduce((sum, pago) => sum + Number(pago.importe || 0), 0)
    const total = Number(factura.total || 0)

    return {
      ...factura,
      cliente_nombre: factura.cliente_id ? clientesMap.get(factura.cliente_id) || null : null,
      pagos: facturaPagos,
      total_pagado: totalPagado,
      pendiente: Math.max(total - totalPagado, 0),
    }
  })
}

export async function registrarPago(input: {
  factura_id: string
  importe: number
  metodo_pago: MetodoPago | string
  fecha_pago?: string
  referencia?: string
  notas?: string
}) {
  const { data, error } = await supabase
    .from('pagos_factura')
    .insert({
      factura_id: input.factura_id,
      importe: Number(input.importe || 0),
      metodo_pago: input.metodo_pago || 'efectivo',
      fecha_pago: input.fecha_pago || new Date().toISOString().slice(0, 10),
      referencia: input.referencia || null,
      notas: input.notas || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as PagoFactura
}

export async function eliminarPago(id: string) {
  const { error } = await supabase.from('pagos_factura').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function marcarFacturaPendiente(facturaId: string) {
  const { error } = await supabase
    .from('facturas')
    .update({ estado: 'pendiente' })
    .eq('id', facturaId)

  if (error) throw new Error(error.message)
}

export function resumenCobros(facturas: FacturaCobro[]) {
  const totalFacturado = facturas.reduce((sum, f) => sum + Number(f.total || 0), 0)
  const totalCobrado = facturas.reduce((sum, f) => sum + Number(f.total_pagado || 0), 0)
  const totalPendiente = facturas.reduce((sum, f) => sum + Number(f.pendiente || 0), 0)
  const facturasPendientes = facturas.filter((f) => Number(f.pendiente || 0) > 0 && f.estado !== 'cancelada').length
  const facturasPagadas = facturas.filter((f) => Number(f.pendiente || 0) <= 0 && Number(f.total || 0) > 0).length

  return {
    totalFacturado,
    totalCobrado,
    totalPendiente,
    facturasPendientes,
    facturasPagadas,
  }
}
