import { supabase } from '@/lib/supabase'
import type { Cliente, ClienteResumen } from '@/types/autokeys'

const TABLE = 'clientes'

export const ClienteService = {
  async getAll(): Promise<ClienteResumen[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const clientes = (data || []) as ClienteResumen[]
    return clientes
  },

  async search(term: string): Promise<ClienteResumen[]> {
    const clean = term.trim()
    if (!clean) return this.getAll()

    const pattern = `%${clean}%`
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or(`nombre.ilike.${pattern},telefono.ilike.${pattern},email.ilike.${pattern},nif.ilike.${pattern}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as ClienteResumen[]
  },

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as Cliente | null
  },

  async create(payload: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        nombre: payload.nombre,
        telefono: payload.telefono || null,
        email: payload.email || null,
        nif: payload.nif || null,
        direccion: payload.direccion || null,
        codigo_postal: payload.codigo_postal || null,
        poblacion: payload.poblacion || null,
        provincia: payload.provincia || null,
        notas: payload.notas || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as Cliente
  },

  async update(id: string, payload: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        nombre: payload.nombre,
        telefono: payload.telefono || null,
        email: payload.email || null,
        nif: payload.nif || null,
        direccion: payload.direccion || null,
        codigo_postal: payload.codigo_postal || null,
        poblacion: payload.poblacion || null,
        provincia: payload.provincia || null,
        notas: payload.notas || null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Cliente
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async getRelated(clienteId: string) {
    const [vehiculos, expedientes, facturas] = await Promise.all([
      supabase.from('vehiculos').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
      supabase.from('expedientes').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
      supabase.from('facturas').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
    ])

    if (vehiculos.error) throw vehiculos.error
    if (expedientes.error) throw expedientes.error
    if (facturas.error) throw facturas.error

    return {
      vehiculos: vehiculos.data || [],
      expedientes: expedientes.data || [],
      facturas: facturas.data || [],
    }
  },
}
