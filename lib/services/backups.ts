import { supabase } from '@/lib/supabase'

export type BackupTable =
  | 'clientes'
  | 'vehiculos'
  | 'expedientes'
  | 'facturas'
  | 'stock'
  | 'file_service'
  | 'usuarios'
  | 'agenda_eventos'
  | 'biblioteca_tecnica'
  | 'auditoria'
  | 'notificaciones'

export async function getTableData(table: BackupTable) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

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

export function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
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

export async function registrarBackup(tipo: string, descripcion?: string) {
  const { error } = await supabase.from('backups').insert({
    tipo,
    descripcion: descripcion || null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.warn('No se pudo registrar el backup:', error.message)
  }
}
