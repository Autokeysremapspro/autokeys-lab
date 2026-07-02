import { supabase } from '@/lib/supabase'

export type AdminOverview = {
  usuarios: number
  usuariosActivos: number
  clientes: number
  vehiculos: number
  expedientes: number
  facturas: number
  stockBajo: number
  fileServicePendiente: number
}

export type AuditLog = {
  id: string
  usuario: string | null
  accion: string
  modulo: string | null
  descripcion: string | null
  created_at: string
}

async function safeCount(table: string, filter?: (query: any) => any) {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) query = filter(query)
    const { count, error } = await query
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [usuarios, usuariosActivos, clientes, vehiculos, expedientes, facturas, stockBajo, fileServicePendiente] = await Promise.all([
    safeCount('usuarios'),
    safeCount('usuarios', (q) => q.eq('activo', true)),
    safeCount('clientes'),
    safeCount('vehiculos'),
    safeCount('expedientes'),
    safeCount('facturas'),
    safeCount('stock', (q) => q.lte('cantidad', 1)),
    safeCount('file_service', (q) => q.in('estado', ['pendiente', 'en_proceso', 'revision'])),
  ])

  return { usuarios, usuariosActivos, clientes, vehiculos, expedientes, facturas, stockBajo, fileServicePendiente }
}

export async function getAuditLogs(limit = 20): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('auditoria_core')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as AuditLog[]
  } catch {
    return []
  }
}
