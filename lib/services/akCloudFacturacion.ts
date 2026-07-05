import { supabase } from '@/lib/supabase'

export type AkCloudRecargaFactura = {
  id: string
  user_id?: string | null
  nombre_cliente?: string | null
  email_cliente?: string | null
  creditos?: number | null
  importe?: number | null
  metodo_pago?: string | null
  estado?: string | null
  referencia_pago?: string | null
  notas_cliente?: string | null
  notas_admin?: string | null
  aprobada_at?: string | null
  core_factura_id?: string | null
  created_at?: string | null
}

export async function getAkCloudRecargasFacturacion(): Promise<AkCloudRecargaFactura[]> {
  const { data, error } = await supabase
    .from('ak_creditos_recargas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as AkCloudRecargaFactura[]
}

export async function crearFacturaDesdeRecarga(recarga: AkCloudRecargaFactura) {
  if (recarga.core_factura_id) {
    return recarga.core_factura_id
  }

  const importe = Number(recarga.importe || 0)
  const creditos = Number(recarga.creditos || 0)

  const notas = [
    'Factura generada desde AK Cloud.',
    recarga.nombre_cliente ? `Distribuidor: ${recarga.nombre_cliente}` : null,
    recarga.email_cliente ? `Email: ${recarga.email_cliente}` : null,
    recarga.metodo_pago ? `Método de pago: ${recarga.metodo_pago}` : null,
    recarga.referencia_pago ? `Referencia: ${recarga.referencia_pago}` : null,
    recarga.id ? `Recarga ID: ${recarga.id}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .insert({
      tipo_documento: 'factura',
      estado: 'pendiente',
      iva_porcentaje: 21,
      notas,
    })
    .select('*')
    .single()

  if (facturaError) throw new Error(facturaError.message)

  const { error: lineaError } = await supabase.from('lineas_factura').insert({
    factura_id: factura.id,
    concepto: `Recarga AK Cloud · ${creditos} créditos`,
    descripcion: recarga.email_cliente || recarga.nombre_cliente || 'Recarga de créditos AK Cloud',
    cantidad: 1,
    precio_unitario: importe,
  })

  if (lineaError) throw new Error(lineaError.message)

  const { error: updateError } = await supabase
    .from('ak_creditos_recargas')
    .update({
      core_factura_id: factura.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recarga.id)

  if (updateError) throw new Error(updateError.message)

  return factura.id as string
}

export async function desvincularFacturaRecarga(recargaId: string) {
  const { error } = await supabase
    .from('ak_creditos_recargas')
    .update({ core_factura_id: null, updated_at: new Date().toISOString() })
    .eq('id', recargaId)

  if (error) throw new Error(error.message)
}
