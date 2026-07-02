export type BackupRegistro = {
  id: string
  tipo: string
  formato: string
  tablas?: string[] | null
  descripcion?: string | null
  total_registros?: number | null
  creado_por?: string | null
  created_at?: string | null
}

export type BackupTableName =
  | 'clientes'
  | 'vehiculos'
  | 'expedientes'
  | 'facturas'
  | 'lineas_factura'
  | 'stock'
  | 'file_service'
  | 'usuarios'
  | 'agenda_eventos'
  | 'biblioteca_tecnica'
  | 'auditoria_eventos'
  | 'notificaciones'

export type BackupExportResult = {
  filename: string
  mimeType: string
  content: string
  total: number
  tablas: string[]
}
