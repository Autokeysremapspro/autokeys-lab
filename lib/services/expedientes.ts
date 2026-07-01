import { supabase } from '@/lib/supabase'
import type {
  Cliente,
  Expediente,
  ExpedienteConRelaciones,
  ExpedienteECU,
  ExpedienteHistorial,
  ExpedienteLlaves,
  Vehiculo,
} from '@/types/autokeys'

const TABLE = 'expedientes'

async function attachRelations(expedientes: Expediente[]): Promise<ExpedienteConRelaciones[]> {
  if (!expedientes.length) return []

  const clienteIds = Array.from(new Set(expedientes.map(e => e.cliente_id).filter(Boolean))) as string[]
  const vehiculoIds = Array.from(new Set(expedientes.map(e => e.vehiculo_id).filter(Boolean))) as string[]
  const expedienteIds = expedientes.map(e => e.id)

  const [clientesRes, vehiculosRes, ecuRes, llavesRes] = await Promise.all([
    clienteIds.length ? supabase.from('clientes').select('*').in('id', clienteIds) : Promise.resolve({ data: [], error: null } as any),
    vehiculoIds.length ? supabase.from('vehiculos').select('*').in('id', vehiculoIds) : Promise.resolve({ data: [], error: null } as any),
    supabase.from('expediente_ecu').select('*').in('expediente_id', expedienteIds),
    supabase.from('expediente_llaves').select('*').in('expediente_id', expedienteIds),
  ])

  const error = clientesRes.error || vehiculosRes.error || ecuRes.error || llavesRes.error
  if (error) throw error

  const clientes = new Map<string, Cliente>(
    ((clientesRes.data || []) as Cliente[]).map((c) => [c.id, c])
  )
  const vehiculos = new Map<string, Vehiculo>(
    ((vehiculosRes.data || []) as Vehiculo[]).map((v) => [v.id, v])
  )
  const ecus = new Map<string, ExpedienteECU>(
    ((ecuRes.data || []) as ExpedienteECU[]).map((e) => [e.expediente_id, e])
  )
  const llaves = new Map<string, ExpedienteLlaves>(
    ((llavesRes.data || []) as ExpedienteLlaves[]).map((l) => [l.expediente_id, l])
  )

  return expedientes.map((e): ExpedienteConRelaciones => ({
    ...e,
    cliente: e.cliente_id ? clientes.get(e.cliente_id) || null : null,
    vehiculo: e.vehiculo_id ? vehiculos.get(e.vehiculo_id) || null : null,
    ecu: ecus.get(e.id) || null,
    llaves: llaves.get(e.id) || null,
  }))
}

export const ExpedienteService = {
  async getAll(): Promise<ExpedienteConRelaciones[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return attachRelations((data || []) as Expediente[])
  },

  async getById(id: string): Promise<ExpedienteConRelaciones | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
    if (error) throw error
    if (!data) return null

    const [withRelations] = await attachRelations([data as Expediente])

    const { data: historial, error: histError } = await supabase
      .from('expediente_historial')
      .select('*')
      .eq('expediente_id', id)
      .order('created_at', { ascending: false })

    if (histError) throw histError
    return { ...withRelations, historial: (historial || []) as ExpedienteHistorial[] }
  },

  async update(id: string, payload: Partial<Expediente>) {
    const { error } = await supabase.from(TABLE).update(payload).eq('id', id)
    if (error) throw error
  },

  async upsertECU(expedienteId: string, payload: Partial<ExpedienteECU>) {
    const { error } = await supabase
      .from('expediente_ecu')
      .upsert({ ...payload, expediente_id: expedienteId }, { onConflict: 'expediente_id' })
    if (error) throw error
  },

  async upsertLlaves(expedienteId: string, payload: Partial<ExpedienteLlaves>) {
    const { error } = await supabase
      .from('expediente_llaves')
      .upsert({ ...payload, expediente_id: expedienteId }, { onConflict: 'expediente_id' })
    if (error) throw error
  },

  async addHistory(expedienteId: string, evento: string, descripcion?: string, usuario = 'Autokeys Core') {
    const { error } = await supabase.from('expediente_historial').insert({
      expediente_id: expedienteId,
      evento,
      descripcion,
      usuario,
    })
    if (error) throw error
  },

  async search(term: string): Promise<ExpedienteConRelaciones[]> {
    const clean = term.trim()
    if (!clean) return this.getAll()

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or(`numero_ot.ilike.%${clean}%,tipo_trabajo.ilike.%${clean}%,estado.ilike.%${clean}%,tecnico.ilike.%${clean}%,descripcion.ilike.%${clean}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return attachRelations((data || []) as Expediente[])
  },
}
