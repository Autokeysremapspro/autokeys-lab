export type EstadoGasto = 'pendiente' | 'pagado' | 'cancelado'

export type MetodoPagoGasto =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'bizim'
  | 'bizum'
  | 'domiciliado'
  | 'otro'

export type CategoriaGasto =
  | 'stock'
  | 'herramientas'
  | 'software'
  | 'licencias'
  | 'alquiler'
  | 'luz'
  | 'internet'
  | 'gestoria'
  | 'marketing'
  | 'material'
  | 'vehiculo'
  | 'otros'

export type Gasto = {
  id: string
  fecha: string
  concepto: string
  categoria: CategoriaGasto | string
  proveedor?: string | null
  factura_numero?: string | null
  base_imponible: number
  iva_porcentaje: number
  iva_importe: number
  total: number
  metodo_pago?: MetodoPagoGasto | string | null
  estado: EstadoGasto | string
  notas?: string | null
  adjunto_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type GastoInput = {
  fecha?: string
  concepto: string
  categoria: CategoriaGasto | string
  proveedor?: string
  factura_numero?: string
  base_imponible: number
  iva_porcentaje: number
  metodo_pago?: MetodoPagoGasto | string
  estado?: EstadoGasto | string
  notas?: string
  adjunto_url?: string
}

export type ResumenGastos = {
  totalMes: number
  totalAnio: number
  totalHistorico: number
  ivaSoportadoMes: number
  pendientes: number
  pagados: number
  beneficioMes: number
}
