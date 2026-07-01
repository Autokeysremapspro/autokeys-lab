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

export type VehiculoConCliente = Vehiculo & { cliente?: Cliente | null }

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
  fecha_entrada?: string | null
  fecha_entrega?: string | null
  precio_estimado?: number | null
  precio_final?: number | null
  pagado?: boolean | null
  metodo_pago?: string | null
  notas_cliente?: string | null
  notas_internas?: string | null
  visible_admin?: boolean | null
  created_at?: string
  updated_at?: string
}

export type ExpedienteECU = {
  id?: string
  expediente_id: string
  marca_ecu?: string | null
  modelo_ecu?: string | null
  hw?: string | null
  sw?: string | null
  vin_original?: string | null
  vin_nuevo?: string | null
  cvn?: string | null
  password?: string | null
  pin?: string | null
  cs?: string | null
  mac?: string | null
  isn?: string | null
  estado_immo?: string | null
  stage?: string | null
  dpf?: string | null
  egr?: string | null
  adblue?: string | null
  checksum?: string | null
  lectura?: string | null
  herramienta?: string | null
  notas?: string | null
}

export type ExpedienteLlaves = {
  id?: string
  expediente_id: string
  llaves_originales?: number | null
  llaves_programadas?: number | null
  tipo_llave?: string | null
  frecuencia?: string | null
  transponder?: string | null
  mando?: string | null
  plataforma?: string | null
  pin?: string | null
  cs?: string | null
  mac?: string | null
  isn?: string | null
  estado?: string | null
  notas?: string | null
}

export type ExpedienteHistorial = {
  id: string
  expediente_id: string
  evento: string
  descripcion?: string | null
  usuario?: string | null
  created_at?: string
}

export type Factura = {
  id: string
  expediente_id?: string | null
  cliente_id?: string | null
  tipo_documento?: string | null
  numero_documento?: string | null
  fecha?: string | null
  subtotal?: number | null
  iva_porcentaje?: number | null
  iva_importe?: number | null
  total?: number | null
  estado?: string | null
  notas?: string | null
  created_at?: string
  updated_at?: string
}

export type ClienteResumen = Cliente & {
  vehiculos_count?: number
  expedientes_count?: number
  facturacion_total?: number
}

export type ExpedienteConRelaciones = Expediente & {
  cliente?: Cliente | null
  vehiculo?: Vehiculo | null
  ecu?: ExpedienteECU | null
  llaves?: ExpedienteLlaves | null
  historial?: ExpedienteHistorial[]
}

export type ArchivoExpediente = {
  id: string
  expediente_id: string
  nombre_archivo: string
  tipo?: string | null
  url?: string | null
  notas?: string | null
  storage_path?: string | null
  mime_type?: string | null
  size_bytes?: number | null
  created_at?: string
}
