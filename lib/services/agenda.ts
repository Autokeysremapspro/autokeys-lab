import { supabase } from '@/lib/supabase'
import type { AgendaEvento, AgendaEventoInput } from '@/types/agenda'

export async function getAgendaEventos(): Promise<AgendaEvento[]> {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select(`
      *,
      cliente:cliente_id ( id, nombre, telefono ),
      vehiculo:vehiculo_id ( id, marca, modelo, matricula, bastidor ),
      expediente:expediente_id ( id, numero_ot, tipo_trabajo, estado )
    `)
    .order('fecha_inicio', { ascending: true })

  if (error) throw error
  return (data || []) as AgendaEvento[]
}

export async function createAgendaEvento(input: AgendaEventoInput) {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .insert(input)
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function updateAgendaEvento(id: string, input: Partial<AgendaEventoInput>) {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .update(input)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function deleteAgendaEvento(id: string) {
  const { error } = await supabase
    .from('agenda_eventos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getAgendaSelectData() {
  const [clientes, vehiculos, expedientes] = await Promise.all([
    supabase.from('clientes').select('id,nombre,telefono').order('nombre', { ascending: true }).limit(500),
    supabase.from('vehiculos').select('id,marca,modelo,matricula,bastidor,cliente_id').order('created_at', { ascending: false }).limit(500),
    supabase.from('expedientes').select('id,numero_ot,tipo_trabajo,estado,cliente_id,vehiculo_id').order('created_at', { ascending: false }).limit(500),
  ])

  if (clientes.error) throw clientes.error
  if (vehiculos.error) throw vehiculos.error
  if (expedientes.error) throw expedientes.error

  return {
    clientes: clientes.data || [],
    vehiculos: vehiculos.data || [],
    expedientes: expedientes.data || [],
  }
}
