import { supabase } from '@/lib/supabase'
import type { BibliotecaPayload, BibliotecaTecnica } from '@/types/biblioteca'

export async function getCasosTecnicos(query = ''): Promise<BibliotecaTecnica[]> {
  let request = supabase
    .from('biblioteca_tecnica')
    .select('*')
    .order('created_at', { ascending: false })

  const q = query.trim()
  if (q) {
    request = request.or([
      `titulo.ilike.%${q}%`,
      `marca.ilike.%${q}%`,
      `modelo.ilike.%${q}%`,
      `motor.ilike.%${q}%`,
      `ecu.ilike.%${q}%`,
      `hardware.ilike.%${q}%`,
      `software.ilike.%${q}%`,
      `tipo_trabajo.ilike.%${q}%`,
      `herramienta.ilike.%${q}%`,
      `sintomas.ilike.%${q}%`,
      `solucion.ilike.%${q}%`,
      `notas.ilike.%${q}%`,
    ].join(','))
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return (data || []) as BibliotecaTecnica[]
}

export async function crearCasoTecnico(payload: BibliotecaPayload) {
  const { data, error } = await supabase
    .from('biblioteca_tecnica')
    .insert(normalizePayload(payload))
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as BibliotecaTecnica
}

export async function actualizarCasoTecnico(id: string, payload: BibliotecaPayload) {
  const { data, error } = await supabase
    .from('biblioteca_tecnica')
    .update(normalizePayload(payload))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as BibliotecaTecnica
}

export async function eliminarCasoTecnico(id: string) {
  const { error } = await supabase.from('biblioteca_tecnica').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

function normalizePayload(payload: BibliotecaPayload) {
  return {
    ...payload,
    titulo: payload.titulo?.trim() || 'Caso técnico sin título',
    marca: payload.marca?.trim() || null,
    modelo: payload.modelo?.trim() || null,
    motor: payload.motor?.trim() || null,
    ecu: payload.ecu?.trim() || null,
    hardware: payload.hardware?.trim() || null,
    software: payload.software?.trim() || null,
    tipo_trabajo: payload.tipo_trabajo?.trim() || null,
    herramienta: payload.herramienta?.trim() || null,
    dificultad: Number(payload.dificultad || 1),
    tiempo_minutos: Number(payload.tiempo_minutos || 0),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
  }
}
