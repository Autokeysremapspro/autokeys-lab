import { supabase } from '@/lib/supabase'

export type AkCloudPedido = {
  id: string
  numero?: string | null
  user_id?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  anio?: string | null
  ecu?: string | null
  hw?: string | null
  sw?: string | null
  cv?: string | null
  cambio?: string | null
  servicios?: string[] | null
  observaciones?: string | null
  estado?: string | null
  prioridad?: string | null
  ori_nombre?: string | null
  ori_bucket?: string | null
  ori_path?: string | null
  ori_size?: number | null
  ori_sha256?: string | null
  mod_nombre?: string | null
  mod_bucket?: string | null
  mod_path?: string | null
  precio?: number | null
  precio_inicial?: number | null
  precio_final?: number | null
  precio_motivo?: string | null
  version_final_id?: string | null
  finalizado_at?: string | null
  pagado?: boolean | null
  creditos_coste?: number | null
  core_cliente_id?: string | null
  core_vehiculo_id?: string | null
  core_expediente_id?: string | null
  tecnico_asignado?: string | null
  notas_core?: string | null
  convertido_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}


export type AkCloudVersion = {
  id: string
  pedido_id: string
  numero_version: number
  nombre_archivo: string
  bucket: string
  path: string
  size_bytes?: number | null
  nota_cliente?: string | null
  nota_interna?: string | null
  es_final?: boolean | null
  estado?: string | null
  created_by?: string | null
  created_at?: string | null
}

export async function getVersionesAkCloud(pedidoId: string): Promise<AkCloudVersion[]> {
  const { data, error } = await supabase
    .from('file_service_versiones')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('numero_version', { ascending: false })
  if (error) {
    console.warn('No se pudieron cargar versiones AK Cloud:', error.message)
    return []
  }
  return (data || []) as AkCloudVersion[]
}

export async function subirVersionAkCloud(
  pedido: AkCloudPedido,
  file: File,
  payload: { notaCliente?: string; notaInterna?: string } = {},
) {
  const existentes = await getVersionesAkCloud(pedido.id)
  const numero = Math.max(0, ...existentes.map((v) => Number(v.numero_version || 0))) + 1
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const base = pedido.numero || pedido.id
  const path = `versiones/${base}/v${numero}-${Date.now()}-${safeName}`
  const bucket = 'file-service'

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
  if (uploadError) throw new Error(uploadError.message)

  const { data, error } = await supabase
    .from('file_service_versiones')
    .insert({
      pedido_id: pedido.id,
      numero_version: numero,
      nombre_archivo: file.name,
      bucket,
      path,
      size_bytes: file.size,
      nota_cliente: payload.notaCliente || null,
      nota_interna: payload.notaInterna || null,
      estado: 'disponible_prueba',
      created_by: 'Autokeys Core',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  await updateAkCloudPedido(pedido.id, {
    estado: 'esperando_prueba',
    mod_bucket: bucket,
    mod_path: path,
    mod_nombre: file.name,
  })
  await crearMensajeAkCloud({
    pedidoId: pedido.id, userId: pedido.user_id || null, autorNombre: 'Autokeys Core', autorTipo: 'admin',
    mensaje: `Versión V${numero} disponible para probar: ${file.name}${payload.notaCliente ? `\n${payload.notaCliente}` : ''}`,
  })
  await crearNotificacionAkCloud({
    userId: pedido.user_id || null, pedidoId: pedido.id, titulo: `Nueva versión V${numero} disponible`,
    mensaje: 'El pedido sigue abierto hasta que el laboratorio lo marque como finalizado.', tipo: 'info',
  })
  return data as AkCloudVersion
}

export async function marcarVersionFinalAkCloud(pedidoId: string, versionId: string) {
  await supabase.from('file_service_versiones').update({ es_final: false }).eq('pedido_id', pedidoId)
  const { data, error } = await supabase.from('file_service_versiones').update({ es_final: true, estado: 'final' }).eq('id', versionId).select('*').single()
  if (error) throw new Error(error.message)
  await updateAkCloudPedido(pedidoId, { version_final_id: versionId })
  return data as AkCloudVersion
}

export async function finalizarPedidoAkCloud(pedido: AkCloudPedido, versionId?: string | null) {
  if (versionId) await marcarVersionFinalAkCloud(pedido.id, versionId)
  const updated = await updateAkCloudPedido(pedido.id, { estado: 'finalizado', finalizado_at: new Date().toISOString() })
  await crearMensajeAkCloud({ pedidoId: pedido.id, userId: pedido.user_id || null, autorNombre: 'Autokeys Core', autorTipo: 'admin', mensaje: 'Pedido marcado como finalizado por el laboratorio.' })
  await crearNotificacionAkCloud({ userId: pedido.user_id || null, pedidoId: pedido.id, titulo: 'Pedido finalizado', mensaje: `${pedido.numero || 'Tu pedido'} ha sido finalizado por Autokeys.`, tipo: 'success' })
  return updated
}

export async function reabrirPedidoAkCloud(pedido: AkCloudPedido) {
  const updated = await updateAkCloudPedido(pedido.id, { estado: 'en_proceso', finalizado_at: null })
  await crearMensajeAkCloud({ pedidoId: pedido.id, userId: pedido.user_id || null, autorNombre: 'Autokeys Core', autorTipo: 'admin', mensaje: 'El laboratorio ha reabierto el pedido.' })
  return updated
}

export type AkCloudMensaje = {
  id: string
  pedido_id: string
  user_id?: string | null
  autor_nombre?: string | null
  autor_tipo?: string | null
  mensaje: string
  leido?: boolean | null
  created_at?: string | null
}

export type AkCloudRecarga = {
  id: string
  user_id?: string | null
  nombre_cliente?: string | null
  email_cliente?: string | null
  creditos?: number | null
  importe?: number | null
  metodo_pago?: string | null
  estado?: string | null
  referencia_pago?: string | null
  notas_cliente?: string | null
  notas_admin?: string | null
  aprobada_at?: string | null
  created_at?: string | null
}

export type AkCloudStats = {
  total: number
  pendientes: number
  enProceso: number
  finalizados: number
  urgentes: number
  facturacion: number
  recargasPendientes: number
  creditosRecargados: number
}

export function akCloudEstadoClass(estado?: string | null) {
  switch (estado) {
    case 'pendiente':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    case 'en_proceso':
    case 'esperando_prueba':
    case 'revision_solicitada':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
    case 'finalizado':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'cancelado':
      return 'border-red-500/30 bg-red-500/10 text-red-300'
    default:
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
  }
}

export function formatServicios(servicios?: string[] | null) {
  if (!servicios || servicios.length === 0) return 'Sin servicios'
  return servicios.join(' + ')
}

export function formatPedidoTitle(pedido: AkCloudPedido) {
  return [pedido.marca, pedido.modelo, pedido.motor].filter(Boolean).join(' · ') || 'Pedido AK Cloud'
}

export async function getAkCloudPedidos(): Promise<AkCloudPedido[]> {
  const { data, error } = await supabase
    .from('file_service_pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as AkCloudPedido[]
}

export async function getAkCloudPedido(id: string): Promise<AkCloudPedido | null> {
  const { data, error } = await supabase
    .from('file_service_pedidos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data || null) as AkCloudPedido | null
}

export async function getAkCloudRecargas(): Promise<AkCloudRecarga[]> {
  const { data, error } = await supabase
    .from('ak_creditos_recargas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.warn('No se pudieron cargar recargas AK Cloud:', error.message)
    return []
  }

  return (data || []) as AkCloudRecarga[]
}

export async function getAkCloudStats(): Promise<AkCloudStats> {
  const [pedidos, recargas] = await Promise.all([getAkCloudPedidos(), getAkCloudRecargas()])

  return {
    total: pedidos.length,
    pendientes: pedidos.filter((p) => (p.estado || 'pendiente') === 'pendiente').length,
    enProceso: pedidos.filter((p) => p.estado === 'en_proceso').length,
    finalizados: pedidos.filter((p) => p.estado === 'finalizado').length,
    urgentes: pedidos.filter((p) => p.prioridad === 'urgente').length,
    facturacion: pedidos.reduce((sum, p) => sum + Number(p.precio || 0), 0),
    recargasPendientes: recargas.filter((r) => (r.estado || 'pendiente') === 'pendiente').length,
    creditosRecargados: recargas
      .filter((r) => r.estado === 'aprobado')
      .reduce((sum, r) => sum + Number(r.creditos || 0), 0),
  }
}

export async function updateAkCloudPedido(id: string, payload: Partial<AkCloudPedido>) {
  const { data, error } = await supabase
    .from('file_service_pedidos')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as AkCloudPedido
}

export async function getSignedFileUrl(bucket?: string | null, path?: string | null) {
  if (!bucket || !path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5)
  if (error) throw new Error(error.message)
  return data?.signedUrl || null
}

export async function subirModAkCloud(pedido: AkCloudPedido, file: File) {
  // Compatibilidad con llamadas antiguas: una subida nunca cierra el pedido.
  // Se registra como una nueva versión y queda esperando la prueba del cliente.
  return subirVersionAkCloud(pedido, file, {
    notaCliente: 'Nueva versión disponible para probar.',
    notaInterna: 'Subida mediante el flujo compatible de archivo MOD.',
  })
}

export async function getMensajesAkCloud(pedidoId: string): Promise<AkCloudMensaje[]> {
  const { data, error } = await supabase
    .from('file_service_mensajes')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('No se pudieron cargar mensajes AK Cloud:', error.message)
    return []
  }

  return (data || []) as AkCloudMensaje[]
}

export async function crearMensajeAkCloud({
  pedidoId,
  userId,
  autorNombre,
  autorTipo,
  mensaje,
}: {
  pedidoId: string
  userId?: string | null
  autorNombre?: string | null
  autorTipo?: string | null
  mensaje: string
}) {
  const { data, error } = await supabase
    .from('file_service_mensajes')
    .insert({
      pedido_id: pedidoId,
      user_id: userId || null,
      autor_nombre: autorNombre || 'Autokeys Core',
      autor_tipo: autorTipo || 'admin',
      mensaje,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as AkCloudMensaje
}

export async function crearNotificacionAkCloud({
  userId,
  pedidoId,
  titulo,
  mensaje,
  tipo = 'info',
}: {
  userId?: string | null
  pedidoId?: string | null
  titulo: string
  mensaje?: string | null
  tipo?: string
}) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('file_service_notificaciones')
    .insert({
      user_id: userId,
      pedido_id: pedidoId || null,
      titulo,
      mensaje: mensaje || null,
      tipo,
    })
    .select('id')
    .single()

  if (error) {
    console.warn('No se pudo crear notificación AK Cloud:', error.message)
    return null
  }

  return data?.id || null
}

async function findOrCreateCoreCliente(pedido: AkCloudPedido) {
  const email = pedido.cliente_email?.trim().toLowerCase()
  const nombre = pedido.cliente_nombre?.trim() || email || 'Distribuidor AK Cloud'

  if (pedido.core_cliente_id) return pedido.core_cliente_id

  if (email) {
    const { data: existing, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (existing?.id) return existing.id as string
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre,
      email: email || null,
      notas: `Cliente/distribuidor creado desde AK Cloud. Pedido origen: ${pedido.numero || pedido.id}`,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

async function createCoreVehiculo(pedido: AkCloudPedido, clienteId: string) {
  if (pedido.core_vehiculo_id) return pedido.core_vehiculo_id

  const { data, error } = await supabase
    .from('vehiculos')
    .insert({
      cliente_id: clienteId,
      marca: pedido.marca || null,
      modelo: pedido.modelo || null,
      motor: pedido.motor || null,
      anio: pedido.anio ? Number(pedido.anio) || null : null,
      ecu: pedido.ecu || null,
      hardware: pedido.hw || null,
      software: pedido.sw || null,
      notas: `Vehículo creado desde AK Cloud. Pedido: ${pedido.numero || pedido.id}`,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

async function createCoreExpediente(pedido: AkCloudPedido, clienteId: string, vehiculoId: string) {
  if (pedido.core_expediente_id) return pedido.core_expediente_id

  const servicios = formatServicios(pedido.servicios)
  const descripcion = [
    `Pedido AK Cloud: ${pedido.numero || pedido.id}`,
    `Servicios: ${servicios}`,
    pedido.observaciones ? `Observaciones: ${pedido.observaciones}` : null,
  ].filter(Boolean).join('\n')

  const { data, error } = await supabase
    .from('expedientes')
    .insert({
      cliente_id: clienteId,
      vehiculo_id: vehiculoId,
      tipo_trabajo: 'File Service AK Cloud',
      descripcion,
      estado: 'en_proceso',
      prioridad: pedido.prioridad === 'urgente' ? 'alta' : 'normal',
      tecnico: pedido.tecnico_asignado || 'Carlos',
      precio_estimado: Number(pedido.precio || 0),
      notas_cliente: pedido.observaciones || null,
      notas_internas: `Origen AK Cloud · ${pedido.numero || pedido.id}`,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const expedienteId = data.id as string

  await supabase.from('expediente_ecu').insert({
    expediente_id: expedienteId,
    marca_ecu: pedido.ecu || null,
    modelo_ecu: pedido.ecu || null,
    hw: pedido.hw || null,
    sw: pedido.sw || null,
    stage: pedido.servicios?.includes('Stage 1') ? 'Stage 1' : pedido.servicios?.includes('Stage 2') ? 'Stage 2' : null,
    dpf: pedido.servicios?.some((s) => s.toLowerCase().includes('dpf')) ? 'OFF' : null,
    egr: pedido.servicios?.some((s) => s.toLowerCase().includes('egr')) ? 'OFF' : null,
    adblue: pedido.servicios?.some((s) => s.toLowerCase().includes('adblue')) ? 'OFF' : null,
    checksum: 'Pendiente',
    lectura: 'AK Cloud',
    herramienta: 'File Service',
    notas: `Servicios solicitados: ${servicios}`,
  })

  await supabase.from('expediente_historial').insert({
    expediente_id: expedienteId,
    evento: 'Pedido AK Cloud convertido',
    descripcion: `Se creó expediente desde el pedido ${pedido.numero || pedido.id}`,
    usuario: 'AK Cloud Sync',
  })

  return expedienteId
}

export async function convertirAkCloudPedidoEnExpediente(pedidoId: string) {
  const pedido = await getAkCloudPedido(pedidoId)
  if (!pedido) throw new Error('Pedido AK Cloud no encontrado')

  const clienteId = await findOrCreateCoreCliente(pedido)
  const vehiculoId = await createCoreVehiculo(pedido, clienteId)
  const expedienteId = await createCoreExpediente(pedido, clienteId, vehiculoId)

  await updateAkCloudPedido(pedido.id, {
    core_cliente_id: clienteId,
    core_vehiculo_id: vehiculoId,
    core_expediente_id: expedienteId,
    estado: pedido.estado === 'pendiente' ? 'en_proceso' : pedido.estado,
    convertido_at: new Date().toISOString(),
  })

  await crearMensajeAkCloud({
    pedidoId: pedido.id,
    userId: pedido.user_id || null,
    autorNombre: 'Autokeys Core',
    autorTipo: 'admin',
    mensaje: 'Pedido recibido por el laboratorio. Se ha creado expediente interno para comenzar el trabajo.',
  })

  await crearNotificacionAkCloud({
    userId: pedido.user_id || null,
    pedidoId: pedido.id,
    titulo: 'Pedido en proceso',
    mensaje: `${pedido.numero || 'Tu pedido'} ya está en el laboratorio.`,
    tipo: 'info',
  })

  return { clienteId, vehiculoId, expedienteId }
}

export async function aprobarRecargaAkCloud(recargaId: string, notasAdmin?: string | null) {
  const response = await fetch('/api/ak-cloud/recargas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: recargaId, estado: 'aprobado', notas_admin: notasAdmin || null }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'No se pudo aprobar la recarga')
  return payload
}

export async function rechazarRecargaAkCloud(recargaId: string, notasAdmin?: string | null) {
  const response = await fetch('/api/ak-cloud/recargas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: recargaId, estado: 'rechazado', notas_admin: notasAdmin || null }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'No se pudo rechazar la recarga')
  return payload
}

export async function getCreditoActualAkCloud(userId?: string | null) {
  if (!userId) return 0

  const { data, error } = await supabase
    .from('ak_creditos_movimientos')
    .select('tipo,creditos')
    .eq('user_id', userId)

  if (error) {
    console.warn('No se pudo calcular saldo AK Cloud:', error.message)
    return 0
  }

  return (data || []).reduce((sum: number, row: any) => {
    const value = Number(row.creditos || 0)
    return row.tipo === 'consumo' ? sum - value : sum + value
  }, 0)
}
