import { supabase } from '@/lib/supabase'
import type { ClienteNota, CrmClienteResumen, CrmVehiculoHistorial } from '@/types/crm'

export async function getCrmClientes(): Promise<CrmClienteResumen[]> {
  const { data, error } = await supabase
    .from('crm_clientes_resumen')
    .select('*')
    .order('total_facturado', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as CrmClienteResumen[]
}

export async function searchCrmClientes(term: string): Promise<CrmClienteResumen[]> {
  const query = term.trim()
  let request = supabase.from('crm_clientes_resumen').select('*')

  if (query) {
    request = request.or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%,nif.ilike.%${query}%`)
  }

  const { data, error } = await request.order('total_facturado', { ascending: false }).limit(50)
  if (error) throw new Error(error.message)
  return (data || []) as CrmClienteResumen[]
}

export async function updateClienteCrm(id: string, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getClienteNotas(clienteId: string): Promise<ClienteNota[]> {
  const { data, error } = await supabase
    .from('cliente_notas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as ClienteNota[]
}

export async function addClienteNota(clienteId: string, nota: string, titulo?: string, importante = false) {
  const { data, error } = await supabase
    .from('cliente_notas')
    .insert({ cliente_id: clienteId, nota, titulo: titulo || null, importante })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ClienteNota
}

export async function deleteClienteNota(id: string) {
  const { error } = await supabase.from('cliente_notas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getHistorialVehiculo(vehiculoId: string): Promise<CrmVehiculoHistorial[]> {
  const { data, error } = await supabase
    .from('crm_vehiculos_historial')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as CrmVehiculoHistorial[]
}

export async function searchHistorialTecnico(term: string): Promise<CrmVehiculoHistorial[]> {
  const query = term.trim()
  let request = supabase.from('crm_vehiculos_historial').select('*')

  if (query) {
    request = request.or(`matricula.ilike.%${query}%,bastidor.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%,motor.ilike.%${query}%,ecu.ilike.%${query}%,numero_ot.ilike.%${query}%,tipo_trabajo.ilike.%${query}%`)
  }

  const { data, error } = await request.order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data || []) as CrmVehiculoHistorial[]
}
