import { supabase } from '@/lib/supabase'
import type { Cliente, Vehiculo, VehiculoConCliente } from '@/types/autokeys'

const TABLE = 'vehiculos'

async function attachClientes(vehiculos: Vehiculo[]): Promise<VehiculoConCliente[]> {
  const ids = Array.from(new Set(vehiculos.map(v => v.cliente_id).filter(Boolean))) as string[]
  if (!ids.length) return vehiculos.map(v => ({ ...v, cliente: null }))

  const { data, error } = await supabase.from('clientes').select('*').in('id', ids)
  if (error) throw error

  const clientes = new Map((data || []).map((c: Cliente) => [c.id, c]))
  return vehiculos.map(v => ({ ...v, cliente: v.cliente_id ? clientes.get(v.cliente_id) || null : null }))
}

export const VehiculoService = {
  async getAll(): Promise<VehiculoConCliente[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return attachClientes((data || []) as Vehiculo[])
  },

  async search(term: string): Promise<VehiculoConCliente[]> {
    const clean = term.trim()
    if (!clean) return this.getAll()

    const pattern = `%${clean}%`
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or(`marca.ilike.${pattern},modelo.ilike.${pattern},motor.ilike.${pattern},matricula.ilike.${pattern},bastidor.ilike.${pattern},ecu.ilike.${pattern}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return attachClientes((data || []) as Vehiculo[])
  },

  async getById(id: string): Promise<VehiculoConCliente | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    const withCliente = await attachClientes([data as Vehiculo])
    return withCliente[0]
  },

  async create(payload: Partial<Vehiculo>): Promise<Vehiculo> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        cliente_id: payload.cliente_id || null,
        marca: payload.marca || null,
        modelo: payload.modelo || null,
        motor: payload.motor || null,
        anio: payload.anio || null,
        matricula: payload.matricula || null,
        bastidor: payload.bastidor || null,
        ecu: payload.ecu || null,
        hardware: payload.hardware || null,
        software: payload.software || null,
        notas: payload.notas || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as Vehiculo
  },

  async update(id: string, payload: Partial<Vehiculo>): Promise<Vehiculo> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        cliente_id: payload.cliente_id || null,
        marca: payload.marca || null,
        modelo: payload.modelo || null,
        motor: payload.motor || null,
        anio: payload.anio || null,
        matricula: payload.matricula || null,
        bastidor: payload.bastidor || null,
        ecu: payload.ecu || null,
        hardware: payload.hardware || null,
        software: payload.software || null,
        notas: payload.notas || null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Vehiculo
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async getRelated(vehiculoId: string) {
    const [expedientes, facturas] = await Promise.all([
      supabase.from('expedientes').select('*').eq('vehiculo_id', vehiculoId).order('created_at', { ascending: false }),
      supabase.from('facturas').select('*').order('created_at', { ascending: false }),
    ])

    if (expedientes.error) throw expedientes.error
    if (facturas.error) throw facturas.error

    return { expedientes: expedientes.data || [], facturas: facturas.data || [] }
  },
}
