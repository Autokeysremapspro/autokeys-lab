export type AuditoriaSeveridad = 'info' | 'success' | 'warning' | 'danger'

export type AuditoriaEvento = {
  id: string
  usuario_id?: string | null
  usuario_nombre?: string | null
  usuario_email?: string | null
  accion: string
  modulo: string
  entidad_tipo?: string | null
  entidad_id?: string | null
  entidad_resumen?: string | null
  descripcion?: string | null
  severidad: AuditoriaSeveridad
  ip?: string | null
  user_agent?: string | null
  metadata?: Record<string, any> | null
  created_at: string
}

export type AuditoriaEventoInput = {
  usuario_id?: string | null
  usuario_nombre?: string | null
  usuario_email?: string | null
  accion: string
  modulo: string
  entidad_tipo?: string | null
  entidad_id?: string | null
  entidad_resumen?: string | null
  descripcion?: string | null
  severidad?: AuditoriaSeveridad
  ip?: string | null
  user_agent?: string | null
  metadata?: Record<string, any> | null
}
