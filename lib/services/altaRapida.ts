import { supabase } from '@/lib/supabase'

export type AltaRapidaPayload = {
  cliente_nombre: string
  cliente_telefono?: string
  cliente_email?: string
  matricula?: string
  marca?: string
  modelo?: string
  motor?: string
  bastidor?: string
  tipo_trabajo: string
  descripcion?: string
  prioridad?: string
  tecnico?: string
}

function clean(value?: string | null) {
  const text = (value || '').trim()
  return text.length ? text : null
}

export async function crearAltaRapida(payload: AltaRapidaPayload) {
  const nombre = clean(payload.cliente_nombre)
  if (!nombre) throw new Error('El nombre del cliente es obligatorio')
  if (!clean(payload.tipo_trabajo)) throw new Error('El tipo de servicio es obligatorio')

  let clienteId: string | null = null

  if (payload.cliente_telefono) {
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', payload.cliente_telefono.trim())
      .maybeSingle()

    clienteId = clienteExistente?.id || null
  }

  if (!clienteId) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre,
        telefono: clean(payload.cliente_telefono),
        email: clean(payload.cliente_email),
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    clienteId = data.id
  }

  let vehiculoId: string | null = null
  const matricula = clean(payload.matricula)?.toUpperCase() || null

  if (matricula) {
    const { data: vehiculoExistente } = await supabase
      .from('vehiculos')
      .select('id')
      .eq('matricula', matricula)
      .maybeSingle()

    vehiculoId = vehiculoExistente?.id || null
  }

  if (!vehiculoId) {
    const { data, error } = await supabase
      .from('vehiculos')
      .insert({
        cliente_id: clienteId,
        matricula,
        marca: clean(payload.marca),
        modelo: clean(payload.modelo),
        motor: clean(payload.motor),
        bastidor: clean(payload.bastidor),
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    vehiculoId = data.id
  }

  const { data: expediente, error: expedienteError } = await supabase
    .from('expedientes')
    .insert({
      cliente_id: clienteId,
      vehiculo_id: vehiculoId,
      tipo_trabajo: clean(payload.tipo_trabajo),
      descripcion: clean(payload.descripcion),
      estado: 'recibido',
      prioridad: clean(payload.prioridad) || 'normal',
      tecnico: clean(payload.tecnico),
      notas_internas: 'Alta rápida creada desde modo móvil.',
    })
    .select('id, numero_ot')
    .single()

  if (expedienteError) throw new Error(expedienteError.message)

  try {
    await supabase.from('expediente_historial').insert({
      expediente_id: expediente.id,
      tipo: 'alta_movil',
      titulo: 'Alta rápida móvil',
      descripcion: 'Expediente creado desde el modo móvil de alta rápida.',
    })
  } catch (_) {
    // Historial opcional según la versión instalada.
  }

  return expediente
}
