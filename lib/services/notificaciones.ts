import { supabase } from '@/lib/supabase'
import type { Notificacion, NotificacionInput } from '@/types/notificaciones'

export type NotificacionesFilters = {
  search?: string
  estado?: 'todas' | 'leidas' | 'no_leidas'
  tipo?: string
  modulo?: string
  limit?: number
}

export async function getNotificaciones(filters: NotificacionesFilters = {}): Promise<Notificacion[]> {
  let query = supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 200)

  if (filters.estado === 'leidas') query = query.eq('leida', true)
  if (filters.estado === 'no_leidas') query = query.eq('leida', false)
  if (filters.tipo && filters.tipo !== 'todos') query = query.eq('tipo', filters.tipo)
  if (filters.modulo && filters.modulo !== 'todos') query = query.eq('modulo', filters.modulo)

  if (filters.search?.trim()) {
    const s = filters.search.trim()
    query = query.or([
      `titulo.ilike.%${s}%`,
      `mensaje.ilike.%${s}%`,
      `modulo.ilike.%${s}%`,
      `prioridad.ilike.%${s}%`,
    ].join(','))
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as Notificacion[]
}

export async function getNotificacionesNoLeidas(limit = 20): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('leida', false)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as Notificacion[]
}

export async function countNotificacionesNoLeidas(): Promise<number> {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('leida', false)

  if (error) throw error
  return count || 0
}

export async function createNotificacion(input: NotificacionInput) {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert({
      tipo: 'info',
      prioridad: 'normal',
      metadata: {},
      ...input,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Notificacion
}

export async function marcarNotificacionLeida(id: string) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true, read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function marcarTodasLeidas() {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true, read_at: new Date().toISOString() })
    .eq('leida', false)

  if (error) throw error
}

export async function eliminarNotificacion(id: string) {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getNotificacionesStats() {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const [total, noLeidas, hoy, urgentes] = await Promise.all([
    supabase.from('notificaciones').select('id', { count: 'exact', head: true }),
    supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('leida', false),
    supabase.from('notificaciones').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString()),
    supabase.from('notificaciones').select('id', { count: 'exact', head: true }).in('prioridad', ['alta', 'urgente']).eq('leida', false),
  ])

  if (total.error) throw total.error
  if (noLeidas.error) throw noLeidas.error
  if (hoy.error) throw hoy.error
  if (urgentes.error) throw urgentes.error

  return {
    total: total.count || 0,
    noLeidas: noLeidas.count || 0,
    hoy: hoy.count || 0,
    urgentes: urgentes.count || 0,
  }
}

export async function crearAvisosAutomaticosBasicos() {
  const avisos: NotificacionInput[] = []

  const [stock, facturas, pedidosAkCloud, expedientes] = await Promise.all([
    supabase.from('stock').select('id,descripcion,cantidad,cantidad_minima').lte('cantidad', 2).limit(10),
    supabase.from('facturas').select('id,numero_documento,total,estado').eq('estado', 'pendiente').limit(10),
    supabase.from('file_service_pedidos').select('id,numero,cliente_nombre,servicios,estado').in('estado', ['pendiente', 'en_proceso']).limit(10),
    supabase.from('expedientes').select('id,numero_ot,tipo_trabajo,prioridad,estado').in('prioridad', ['alta', 'urgente']).neq('estado', 'entregado').limit(10),
  ])

  ;(stock.data || []).forEach((s: any) => avisos.push({
    titulo: 'Stock bajo',
    mensaje: `${s.descripcion || 'Producto'} · quedan ${s.cantidad ?? 0}`,
    modulo: 'Stock',
    tipo: 'warning',
    prioridad: 'alta',
    href: '/stock',
    accion_texto: 'Abrir stock',
    metadata: { origen: 'auto', stock_id: s.id },
  }))

  ;(facturas.data || []).forEach((f: any) => avisos.push({
    titulo: 'Factura pendiente de cobro',
    mensaje: `${f.numero_documento || 'Documento'} · ${Number(f.total || 0).toFixed(2)} €`,
    modulo: 'Facturación',
    tipo: 'info',
    prioridad: 'normal',
    href: '/facturas',
    accion_texto: 'Ver facturas',
    metadata: { origen: 'auto', factura_id: f.id },
  }))

  ;(pedidosAkCloud.data || []).forEach((p: any) => avisos.push({
    titulo: 'Pedido AK Cloud pendiente',
    mensaje: [p.numero ? `#${p.numero}` : null, p.cliente_nombre, Array.isArray(p.servicios) ? p.servicios.join(', ') : null].filter(Boolean).join(' · '),
    modulo: 'AK Cloud',
    tipo: 'info',
    prioridad: p.estado === 'en_proceso' ? 'alta' : 'normal',
    href: '/ak-cloud',
    accion_texto: 'Abrir AK Cloud',
    metadata: { origen: 'auto', pedido_id: p.id },
  }))

  ;(expedientes.data || []).forEach((e: any) => avisos.push({
    titulo: e.prioridad === 'urgente' ? 'OT urgente' : 'OT de alta prioridad',
    mensaje: `${e.numero_ot || 'OT'} · ${e.tipo_trabajo || 'Trabajo'} · ${e.estado || ''}`,
    modulo: 'Expedientes',
    tipo: e.prioridad === 'urgente' ? 'danger' : 'warning',
    prioridad: e.prioridad === 'urgente' ? 'urgente' : 'alta',
    href: `/expedientes/${e.id}`,
    accion_texto: 'Abrir OT',
    metadata: { origen: 'auto', expediente_id: e.id },
  }))

  return avisos.slice(0, 30)
}
