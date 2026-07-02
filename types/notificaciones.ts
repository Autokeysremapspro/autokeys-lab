export type NotificacionTipo = 'info' | 'success' | 'warning' | 'danger'
export type NotificacionPrioridad = 'baja' | 'normal' | 'alta' | 'urgente'

export type Notificacion = {
  id: string
  usuario_id?: string | null
  titulo: string
  mensaje?: string | null
  modulo?: string | null
  tipo: NotificacionTipo
  prioridad: NotificacionPrioridad
  href?: string | null
  accion_texto?: string | null
  leida: boolean
  read_at?: string | null
  expires_at?: string | null
  metadata?: Record<string, any> | null
  created_at?: string | null
}

export type NotificacionInput = {
  usuario_id?: string | null
  titulo: string
  mensaje?: string | null
  modulo?: string | null
  tipo?: NotificacionTipo
  prioridad?: NotificacionPrioridad
  href?: string | null
  accion_texto?: string | null
  expires_at?: string | null
  metadata?: Record<string, any>
}
