export type TipoCliente = 'premium' | 'normal' | 'distribuidor' | 'moroso' | 'bloqueado'
export type EstadoCliente = 'activo' | 'pendiente' | 'bloqueado'

export type CrmClienteResumen = {
  id: string
  nombre: string
  telefono?: string | null
  email?: string | null
  nif?: string | null
  tipo_cliente?: TipoCliente | string | null
  estado_cliente?: EstadoCliente | string | null
  descuento_porcentaje?: number | null
  ultima_visita?: string | null
  created_at?: string | null
  vehiculos_count?: number | null
  expedientes_count?: number | null
  total_facturado?: number | null
  pendiente_cobro?: number | null
}

export type CrmVehiculoHistorial = {
  vehiculo_id: string
  cliente_id?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  matricula?: string | null
  bastidor?: string | null
  ecu?: string | null
  expediente_id?: string | null
  numero_ot?: string | null
  tipo_trabajo?: string | null
  estado?: string | null
  prioridad?: string | null
  fecha_entrada?: string | null
  fecha_entrega?: string | null
  precio_final?: number | null
  created_at?: string | null
}

export type ClienteNota = {
  id: string
  cliente_id: string
  titulo?: string | null
  nota: string
  tipo?: string | null
  importante?: boolean | null
  creado_por?: string | null
  created_at?: string | null
  updated_at?: string | null
}
