import { supabase } from '@/lib/supabase'

export type DistribuidorUsuario = {
  id: string
  nombre: string
  email: string
  rol?: string | null
  activo?: boolean | null
}

export type DistribuidorPerfil = {
  id?: string
  usuario_id: string
  nombre_comercial?: string | null
  cif?: string | null
  telefono?: string | null
  email_facturacion?: string | null
  direccion?: string | null
  poblacion?: string | null
  provincia?: string | null
  codigo_postal?: string | null
  tarifa?: string | null
  activo?: boolean | null
  notas?: string | null
}

export type SolicitudDistribuidor = {
  id: string
  distribuidor_id?: string | null
  taller?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  matricula?: string | null
  ecu?: string | null
  hw?: string | null
  sw?: string | null
  servicio: string
  estado?: string | null
  precio?: number | null
  pagado?: boolean | null
  prioridad?: string | null
  fecha_entrega_prevista?: string | null
  notas?: string | null
  created_at?: string | null
  usuarios?: DistribuidorUsuario | null
}

export type MensajeDistribuidor = {
  id: string
  file_service_id: string
  distribuidor_id?: string | null
  autor?: string | null
  mensaje: string
  visible_distribuidor?: boolean | null
  created_at?: string | null
}

export async function getDistribuidores() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id,nombre,email,rol,activo')
    .eq('rol', 'distribuidor')
    .order('nombre')

  if (error) throw error
  return (data || []) as DistribuidorUsuario[]
}

export async function getPerfilesDistribuidores() {
  const { data, error } = await supabase
    .from('distribuidor_perfiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as DistribuidorPerfil[]
}

export async function upsertPerfilDistribuidor(payload: DistribuidorPerfil) {
  const { data, error } = await supabase
    .from('distribuidor_perfiles')
    .upsert(payload, { onConflict: 'usuario_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as DistribuidorPerfil
}

export async function getSolicitudesDistribuidores() {
  const { data, error } = await supabase
    .from('file_service')
    .select('*, usuarios:distribuidor_id(id,nombre,email,rol,activo)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as SolicitudDistribuidor[]
}

export async function crearSolicitudDistribuidor(payload: Partial<SolicitudDistribuidor>) {
  const { data, error } = await supabase
    .from('file_service')
    .insert({
      distribuidor_id: payload.distribuidor_id || null,
      taller: payload.taller || null,
      marca: payload.marca || null,
      modelo: payload.modelo || null,
      motor: payload.motor || null,
      matricula: payload.matricula || null,
      ecu: payload.ecu || null,
      hw: payload.hw || null,
      sw: payload.sw || null,
      servicio: payload.servicio || 'File Service',
      estado: payload.estado || 'pendiente',
      prioridad: payload.prioridad || 'normal',
      precio: Number(payload.precio || 0),
      pagado: Boolean(payload.pagado),
      fecha_entrega_prevista: payload.fecha_entrega_prevista || null,
      notas: payload.notas || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as SolicitudDistribuidor
}

export async function actualizarSolicitudDistribuidor(id: string, payload: Partial<SolicitudDistribuidor>) {
  const { data, error } = await supabase
    .from('file_service')
    .update({
      distribuidor_id: payload.distribuidor_id || null,
      taller: payload.taller || null,
      marca: payload.marca || null,
      modelo: payload.modelo || null,
      motor: payload.motor || null,
      matricula: payload.matricula || null,
      ecu: payload.ecu || null,
      hw: payload.hw || null,
      sw: payload.sw || null,
      servicio: payload.servicio || 'File Service',
      estado: payload.estado || 'pendiente',
      prioridad: payload.prioridad || 'normal',
      precio: Number(payload.precio || 0),
      pagado: Boolean(payload.pagado),
      fecha_entrega_prevista: payload.fecha_entrega_prevista || null,
      notas: payload.notas || null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as SolicitudDistribuidor
}

export async function eliminarSolicitudDistribuidor(id: string) {
  const { error } = await supabase.from('file_service').delete().eq('id', id)
  if (error) throw error
}

export async function getMensajesSolicitud(fileServiceId: string) {
  const { data, error } = await supabase
    .from('portal_distribuidor_mensajes')
    .select('*')
    .eq('file_service_id', fileServiceId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as MensajeDistribuidor[]
}

export async function crearMensajeSolicitud(payload: Partial<MensajeDistribuidor>) {
  const { data, error } = await supabase
    .from('portal_distribuidor_mensajes')
    .insert({
      file_service_id: payload.file_service_id,
      distribuidor_id: payload.distribuidor_id || null,
      autor: payload.autor || 'Autokeys',
      mensaje: payload.mensaje || '',
      visible_distribuidor: payload.visible_distribuidor !== false,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as MensajeDistribuidor
}
