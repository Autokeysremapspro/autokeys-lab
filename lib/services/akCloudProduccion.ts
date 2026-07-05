import { supabase } from '@/lib/supabase'

export type ProduccionEstado = 'pendiente' | 'analizando' | 'en_proceso' | 'calidad' | 'finalizado' | 'cancelado'

export type AkCloudProduccionPedido = {
  id: string
  numero?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  ecu?: string | null
  hw?: string | null
  sw?: string | null
  servicios?: string[] | null
  estado?: ProduccionEstado | string | null
  prioridad?: string | null
  urgente?: boolean | null
  precio?: number | null
  creditos_coste?: number | null
  tecnico_asignado?: string | null
  notas_core?: string | null
  notas_internas?: string | null
  ori_nombre?: string | null
  mod_nombre?: string | null
  core_expediente_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ProduccionStats = {
  total: number
  nuevos: number
  analizando: number
  enProceso: number
  calidad: number
  finalizados: number
  urgentes: number
}

export const PRODUCCION_COLUMNAS: { estado: ProduccionEstado; titulo: string; descripcion: string }[] = [
  { estado: 'pendiente', titulo: 'Nuevos', descripcion: 'Pedidos recibidos desde AK Cloud' },
  { estado: 'analizando', titulo: 'Analizando', descripcion: 'Revisión de ORI, ECU, HW y SW' },
  { estado: 'en_proceso', titulo: 'En proceso', descripcion: 'Archivo en modificación' },
  { estado: 'calidad', titulo: 'Control calidad', descripcion: 'Revisión antes de entregar' },
  { estado: 'finalizado', titulo: 'Finalizados', descripcion: 'MOD listo para descargar' },
]

export function normalizarEstado(estado?: string | null): ProduccionEstado {
  if (estado === 'analizando' || estado === 'en_proceso' || estado === 'calidad' || estado === 'finalizado' || estado === 'cancelado') return estado
  return 'pendiente'
}

export function estadoLabel(estado?: string | null) {
  switch (normalizarEstado(estado)) {
    case 'pendiente': return 'Nuevo'
    case 'analizando': return 'Analizando'
    case 'en_proceso': return 'En proceso'
    case 'calidad': return 'Calidad'
    case 'finalizado': return 'Finalizado'
    case 'cancelado': return 'Cancelado'
  }
}

export function estadoClass(estado?: string | null) {
  switch (normalizarEstado(estado)) {
    case 'pendiente': return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    case 'analizando': return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
    case 'en_proceso': return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
    case 'calidad': return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    case 'finalizado': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'cancelado': return 'border-red-500/30 bg-red-500/10 text-red-300'
  }
}

export function serviciosTexto(servicios?: string[] | null) {
  if (!servicios || servicios.length === 0) return 'Sin servicios'
  return servicios.join(' + ')
}

export function tituloPedido(pedido: AkCloudProduccionPedido) {
  return [pedido.marca, pedido.modelo, pedido.motor].filter(Boolean).join(' · ') || 'Pedido AK Cloud'
}

export function minutosDesde(fecha?: string | null) {
  if (!fecha) return 0
  const diff = Date.now() - new Date(fecha).getTime()
  return Math.max(0, Math.round(diff / 60000))
}

export function tiempoHumano(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h < 24) return `${h} h ${m} min`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return `${d} d ${rh} h`
}

export async function getPedidosProduccion(): Promise<AkCloudProduccionPedido[]> {
  const { data, error } = await supabase
    .from('file_service_pedidos')
    .select('*')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as AkCloudProduccionPedido[]
}

export async function actualizarEstadoProduccion(id: string, estado: ProduccionEstado) {
  const payload: Record<string, any> = {
    estado,
    updated_at: new Date().toISOString(),
  }

  if (estado === 'finalizado') payload.finalizado_at = new Date().toISOString()
  if (estado === 'en_proceso') payload.iniciado_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('file_service_pedidos')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  await crearNotificacionEstado(data as AkCloudProduccionPedido, estado).catch(() => null)
  return data as AkCloudProduccionPedido
}

export async function asignarTecnicoProduccion(id: string, tecnico: string) {
  const { data, error } = await supabase
    .from('file_service_pedidos')
    .update({ tecnico_asignado: tecnico || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as AkCloudProduccionPedido
}

async function crearNotificacionEstado(pedido: AkCloudProduccionPedido, estado: ProduccionEstado) {
  const userId = pedido.user_id || null
  if (!userId) return

  const titulo = estado === 'finalizado' ? 'Archivo listo' : 'Estado actualizado'
  const mensaje = estado === 'finalizado'
    ? `Tu pedido ${pedido.numero || ''} ya está finalizado.`
    : `Tu pedido ${pedido.numero || ''} cambió a ${estadoLabel(estado)}.`

  await supabase.from('ak_notificaciones').insert({
    user_id: userId,
    pedido_id: pedido.id,
    tipo: estado === 'finalizado' ? 'mod_listo' : 'estado',
    titulo,
    mensaje,
    leida: false,
  })
}

export function getProduccionStats(pedidos: AkCloudProduccionPedido[]): ProduccionStats {
  return {
    total: pedidos.length,
    nuevos: pedidos.filter((p) => normalizarEstado(p.estado) === 'pendiente').length,
    analizando: pedidos.filter((p) => normalizarEstado(p.estado) === 'analizando').length,
    enProceso: pedidos.filter((p) => normalizarEstado(p.estado) === 'en_proceso').length,
    calidad: pedidos.filter((p) => normalizarEstado(p.estado) === 'calidad').length,
    finalizados: pedidos.filter((p) => normalizarEstado(p.estado) === 'finalizado').length,
    urgentes: pedidos.filter((p) => p.urgente || p.prioridad === 'urgente').length,
  }
}
