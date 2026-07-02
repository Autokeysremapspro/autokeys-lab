export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum' | 'otro'

export type PagoFactura = {
  id: string
  factura_id: string
  importe: number
  metodo_pago: MetodoPago | string
  fecha_pago: string
  referencia?: string | null
  notas?: string | null
  creado_por?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type FacturaCobro = {
  id: string
  numero_documento?: string | null
  tipo_documento?: string | null
  cliente_id?: string | null
  expediente_id?: string | null
  fecha?: string | null
  estado?: string | null
  subtotal?: number | null
  iva_importe?: number | null
  total?: number | null
  notas?: string | null
  created_at?: string | null
  cliente_nombre?: string | null
  pagos?: PagoFactura[]
  total_pagado?: number
  pendiente?: number
}
