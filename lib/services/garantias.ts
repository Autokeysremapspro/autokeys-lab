import { supabase } from '@/lib/supabase'

export type GarantiaExpediente = {
  id: string
  expediente_id: string
  entrega_id?: string | null
  tipo?: string | null
  titulo?: string | null
  receptor_nombre?: string | null
  receptor_dni?: string | null
  trabajo_realizado?: string | null
  condiciones?: string | null
  observaciones?: string | null
  firma_url?: string | null
  documento_url?: string | null
  generado_por?: string | null
  generado_at?: string | null
  created_at?: string | null
}

export type GarantiaExpedienteResumen = {
  id: string
  numero_ot?: string | null
  tipo_trabajo?: string | null
  descripcion?: string | null
  estado?: string | null
  cliente_id?: string | null
  vehiculo_id?: string | null
  clientes?: { nombre?: string | null; telefono?: string | null; nif?: string | null } | null
  vehiculos?: { marca?: string | null; modelo?: string | null; matricula?: string | null; bastidor?: string | null } | null
}

export type CrearGarantiaParams = {
  expedienteId: string
  entregaId?: string | null
  titulo?: string
  receptorNombre?: string
  receptorDni?: string
  trabajoRealizado?: string
  condiciones?: string
  observaciones?: string
  firmaUrl?: string | null
  generadoPor?: string
}

export const GarantiaService = {
  async buscarExpedientes(term: string): Promise<GarantiaExpedienteResumen[]> {
    const clean = term.trim()

    let query = supabase
      .from('expedientes')
      .select(`
        id,
        numero_ot,
        tipo_trabajo,
        descripcion,
        estado,
        cliente_id,
        vehiculo_id,
        clientes:cliente_id (
          nombre,
          telefono,
          nif
        ),
        vehiculos:vehiculo_id (
          marca,
          modelo,
          matricula,
          bastidor
        )
      `)
      .order('created_at', { ascending: false })
      .limit(40)

    if (clean.length >= 2) {
      query = query.or(`numero_ot.ilike.%${clean}%,tipo_trabajo.ilike.%${clean}%,descripcion.ilike.%${clean}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as GarantiaExpedienteResumen[]
  },

  async getGarantiasExpediente(expedienteId: string): Promise<GarantiaExpediente[]> {
    const { data, error } = await supabase
      .from('garantias_expediente')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as GarantiaExpediente[]
  },

  async crearGarantia(params: CrearGarantiaParams): Promise<GarantiaExpediente> {
    const payload = {
      expediente_id: params.expedienteId,
      entrega_id: params.entregaId || null,
      tipo: 'garantia',
      titulo: params.titulo || 'Garantía de servicio',
      receptor_nombre: params.receptorNombre || null,
      receptor_dni: params.receptorDni || null,
      trabajo_realizado: params.trabajoRealizado || null,
      condiciones: params.condiciones || null,
      observaciones: params.observaciones || null,
      firma_url: params.firmaUrl || null,
      generado_por: params.generadoPor || 'Autokeys Core',
      generado_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('garantias_expediente')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error

    await supabase.from('expediente_historial').insert({
      expediente_id: params.expedienteId,
      evento: 'Garantía generada',
      descripcion: params.trabajoRealizado || params.observaciones || 'Documento de garantía generado desde Autokeys Core.',
      usuario: params.generadoPor || 'Autokeys Core',
    })

    return data as GarantiaExpediente
  },

  async eliminarGarantia(id: string) {
    const { error } = await supabase.from('garantias_expediente').delete().eq('id', id)
    if (error) throw error
  },
}
