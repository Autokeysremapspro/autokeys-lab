import { supabase } from '@/lib/supabase'
import type { BackupRegistro, BackupTableName, BackupExportResult } from '@/types/backups'

export const BACKUP_TABLES: { name: BackupTableName; label: string }[] = [
  { name: 'clientes', label: 'Clientes' },
  { name: 'vehiculos', label: 'Vehículos' },
  { name: 'expedientes', label: 'Expedientes / OT' },
  { name: 'facturas', label: 'Facturas' },
  { name: 'lineas_factura', label: 'Líneas factura' },
  { name: 'stock', label: 'Stock' },
  { name: 'file_service', label: 'File Service' },
  { name: 'usuarios', label: 'Usuarios' },
  { name: 'agenda_eventos', label: 'Agenda' },
  { name: 'biblioteca_tecnica', label: 'Biblioteca Técnica' },
  { name: 'auditoria_eventos', label: 'Auditoría' },
  { name: 'notificaciones', label: 'Notificaciones' },
]

export const QUICK_EXPORTS = [
  { key: 'clientes', label: 'Clientes CSV', table: 'clientes' as BackupTableName, format: 'csv' as const },
  { key: 'vehiculos', label: 'Vehículos CSV', table: 'vehiculos' as BackupTableName, format: 'csv' as const },
  { key: 'expedientes', label: 'Expedientes CSV', table: 'expedientes' as BackupTableName, format: 'csv' as const },
  { key: 'facturas', label: 'Facturas CSV', table: 'facturas' as BackupTableName, format: 'csv' as const },
  { key: 'stock', label: 'Stock CSV', table: 'stock' as BackupTableName, format: 'csv' as const },
]

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  const escaped = text.replace(/"/g, '""')
  return /[",\n\r;]/.test(escaped) ? `"${escaped}"` : escaped
}

export function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return ''
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key))
    return set
  }, new Set<string>()))

  const lines = [headers.join(';')]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row?.[header])).join(';'))
  }
  return lines.join('\n')
}

export async function getBackupRegistros(limit = 50): Promise<BackupRegistro[]> {
  const { data, error } = await supabase
    .from('backup_registros')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as BackupRegistro[]
}

export async function registrarBackup(input: {
  tipo: string
  formato: string
  tablas: string[]
  descripcion: string
  total_registros: number
}) {
  const { data: userData } = await supabase.auth.getUser()
  const creado_por = userData?.user?.email || 'sistema'

  const { error } = await supabase.from('backup_registros').insert({
    ...input,
    creado_por,
  })

  if (error) throw error
}

export async function fetchTableRows(table: BackupTableName): Promise<Record<string, any>[]> {
  const { data, error } = await (supabase.from(table as any) as any)
    .select('*')
    .limit(50000)

  if (error) throw error
  return (data || []) as Record<string, any>[]
}

export async function exportTable(table: BackupTableName, format: 'csv' | 'json'): Promise<BackupExportResult> {
  const rows = await fetchTableRows(table)
  const content = format === 'csv' ? toCsv(rows) : JSON.stringify(rows, null, 2)
  const filename = `autokeys-core-${table}-${nowStamp()}.${format}`

  await registrarBackup({
    tipo: table,
    formato: format,
    tablas: [table],
    descripcion: `Exportación de ${table.toUpperCase()} en ${format.toUpperCase()}`,
    total_registros: rows.length,
  })

  return {
    filename,
    mimeType: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    content,
    total: rows.length,
    tablas: [table],
  }
}

export async function exportFullJson(tables: BackupTableName[] = BACKUP_TABLES.map(t => t.name)): Promise<BackupExportResult> {
  const result: Record<string, any> = {
    generated_at: new Date().toISOString(),
    app: 'Autokeys Core',
    version: 'v2.5',
    tables: {},
    errors: {},
  }

  let total = 0
  const exported: string[] = []

  for (const table of tables) {
    try {
      const rows = await fetchTableRows(table)
      result.tables[table] = rows
      total += rows.length
      exported.push(table)
    } catch (error: any) {
      result.errors[table] = error?.message || 'No se pudo exportar esta tabla'
    }
  }

  await registrarBackup({
    tipo: 'completo',
    formato: 'json',
    tablas: exported,
    descripcion: 'Exportación completa JSON de Autokeys Core',
    total_registros: total,
  })

  return {
    filename: `autokeys-core-backup-completo-${nowStamp()}.json`,
    mimeType: 'application/json;charset=utf-8',
    content: JSON.stringify(result, null, 2),
    total,
    tablas: exported,
  }
}
