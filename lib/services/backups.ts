import { supabase } from '@/lib/supabase'

export type BackupTable =
  | 'clientes'
  | 'vehiculos'
  | 'expedientes'
  | 'facturas'
  | 'stock'
  | 'file_service'
  | 'usuarios_app'
  | 'agenda_eventos'
  | 'biblioteca_tecnica'
  | 'auditoria_eventos'
  | 'notificaciones'
  | 'lineas_factura'
  | 'pagos_factura'
  | 'gastos'
  | 'garantias_expediente'
  | 'configuracion_empresa'

export const BACKUP_TABLES: { name: BackupTable; key: BackupTable; label: string }[] = [
  { name: 'clientes', key: 'clientes', label: 'Clientes' },
  { name: 'vehiculos', key: 'vehiculos', label: 'Vehículos' },
  { name: 'expedientes', key: 'expedientes', label: 'Expedientes' },
  { name: 'facturas', key: 'facturas', label: 'Facturas' },
  { name: 'stock', key: 'stock', label: 'Stock' },
  { name: 'file_service', key: 'file_service', label: 'File Service' },
  { name: 'usuarios_app', key: 'usuarios_app', label: 'Usuarios' },
  { name: 'agenda_eventos', key: 'agenda_eventos', label: 'Agenda' },
  { name: 'biblioteca_tecnica', key: 'biblioteca_tecnica', label: 'Biblioteca Técnica' },
  { name: 'auditoria_eventos', key: 'auditoria_eventos', label: 'Auditoría' },
  { name: 'notificaciones', key: 'notificaciones', label: 'Notificaciones' },
  { name: 'lineas_factura', key: 'lineas_factura', label: 'Líneas de documentos' },
  { name: 'pagos_factura', key: 'pagos_factura', label: 'Pagos' },
  { name: 'gastos', key: 'gastos', label: 'Gastos' },
  { name: 'garantias_expediente', key: 'garantias_expediente', label: 'Garantías' },
  { name: 'configuracion_empresa', key: 'configuracion_empresa', label: 'Configuración' },]


export const QUICK_EXPORTS = [
  { label: 'Clientes', table: 'clientes' as BackupTable },
  { label: 'Vehículos', table: 'vehiculos' as BackupTable },
  { label: 'Expedientes', table: 'expedientes' as BackupTable },
  { label: 'Facturas', table: 'facturas' as BackupTable },
  { label: 'Stock', table: 'stock' as BackupTable },
]

export async function getTableData(table: BackupTable) {
  const { data, error } = await supabase
    .from(table)
    .select('*')

  if (error) throw new Error(error.message)

  return data || []
}

export async function getMultipleTablesData(tables: BackupTable[]) {
  const result: Record<string, any[]> = {}

  for (const table of tables) {
    result[table] = await getTableData(table)
  }

  return result
}

export function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return ''

  const headerSet = new Set<string>()

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => headerSet.add(key))
  })

  const headers = Array.from(headerSet)

  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header]

          if (value === null || value === undefined) return ''

          const escaped = String(value).replace(/"/g, '""')

          return `"${escaped}"`
        })
        .join(',')
    ),
  ]

  return csv.join('\n')
}

export function downloadFile(
  filename: string,
  content: string,
  mimeType = 'text/plain'
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function getBackupFilename(prefix: string, extension: string) {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-')

  return `${prefix}-${timestamp}.${extension}`
}

export async function registrarBackup(tipo: string, descripcion?: string, tablas: BackupTable[] = [], totalRegistros = 0) {
  const { error } = await supabase.from('backup_registros').insert({
    tipo,
    formato: tipo,
    tablas,
    total_registros: totalRegistros,
    descripcion: descripcion || null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.warn('No se pudo registrar el backup:', error.message)
  }
}

export async function exportTable(table: BackupTable) {
  const rows = await getTableData(table)
  const csv = toCsv(rows as Record<string, any>[])

  const filename = getBackupFilename(`autokeys-${table}`, 'csv')

  downloadFile(filename, csv, 'text/csv;charset=utf-8;')

  await registrarBackup('csv', `Exportación CSV de ${table}`, [table], rows.length)
}

export async function exportFullJson(tables: BackupTable[]) {
  const data = await getMultipleTablesData(tables)

  const content = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      tables,
      data,
    },
    null,
    2
  )

  const filename = getBackupFilename('autokeys-backup-completo', 'json')

  downloadFile(filename, content, 'application/json;charset=utf-8;')

  const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0)
  await registrarBackup('json', `Exportación JSON: ${tables.join(', ')}`, tables, total)
}

export async function getBackupRegistros() {
  const { data, error } = await supabase
    .from('backup_registros')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('No se pudieron cargar los registros de backup:', error.message)
    return []
  }

  return data || []
}
