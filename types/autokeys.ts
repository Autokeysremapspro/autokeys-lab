export type Cliente = {
  id: string
  nombre: string
  telefono?: string | null
  email?: string | null
  nif?: string | null
  direccion?: string | null
  codigo_postal?: string | null
  poblacion?: string | null
  provincia?: string | null
  notas?: string | null
  created_at?: string
  updated_at?: string
}

export type Vehiculo = {
  id: string
  cliente_id?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  anio?: number | null
  matricula?: string | null
  bastidor?: string | null
  ecu?: string | null
  hardware?: string | null
  software?: string | null
  notas?: string | null
  created_at?: string
  updated_at?: string
}

export type Expediente = {
  id: string
  numero_ot?: string | null
  cliente_id?: string | null
  vehiculo_id?: string | null
  tipo_trabajo: string
  descripcion?: string | null
  estado?: string | null
  prioridad?: string | null
  tecnico?: string | null
  precio_estimado?: number | null
  precio_final?: number | null
  created_at?: string
}

export type Factura = {
  id: string
  cliente_id?: string | null
  expediente_id?: string | null
  tipo_documento?: string | null
  numero_documento?: string | null
  total?: number | null
  estado?: string | null
  created_at?: string
}

export type VehiculoConCliente = Vehiculo & {
  cliente?: Cliente | null
  expedientes_count?: number
}

export type ClienteResumen = Cliente & {
  vehiculos_count?: number
  expedientes_count?: number
  facturacion_total?: number
}
