import { supabase } from '@/lib/supabase'
import { getSignedFileUrl } from '@/lib/services/storageAccess'

const BUCKET = 'autokeys-expedientes'

type ExpedienteEntregaResumen = {
  id: string
  numero_ot?: string | null
  tipo_trabajo?: string | null
  estado?: string | null
  prioridad?: string | null
  cliente_id?: string | null
  vehiculo_id?: string | null
  clientes?: { nombre?: string | null; telefono?: string | null } | null
  vehiculos?: { marca?: string | null; modelo?: string | null; matricula?: string | null } | null
}

type CrearEntregaParams = {
  expedienteId: string
  receptorNombre: string
  receptorDni?: string
  observaciones?: string
  firmaBlob: Blob
  entregadoPor?: string
}

function safeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const EntregaService = {
  async buscarExpedientes(term: string): Promise<ExpedienteEntregaResumen[]> {
    const clean = term.trim()

    let query = supabase
      .from('expedientes')
      .select(`
        id,
        numero_ot,
        tipo_trabajo,
        estado,
        prioridad,
        cliente_id,
        vehiculo_id,
        clientes:cliente_id ( nombre, telefono ),
        vehiculos:vehiculo_id ( marca, modelo, matricula )
      `)
      .order('created_at', { ascending: false })
      .limit(25)

    if (clean) {
      query = query.or(
        `numero_ot.ilike.%${clean}%,tipo_trabajo.ilike.%${clean}%,estado.ilike.%${clean}%,tecnico.ilike.%${clean}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as any
  },

  async getExpediente(id: string): Promise<ExpedienteEntregaResumen | null> {
    const { data, error } = await supabase
      .from('expedientes')
      .select(`
        id,
        numero_ot,
        tipo_trabajo,
        estado,
        prioridad,
        cliente_id,
        vehiculo_id,
        clientes:cliente_id ( nombre, telefono ),
        vehiculos:vehiculo_id ( marca, modelo, matricula )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return (data || null) as any
  },

  async crearEntrega(params: CrearEntregaParams) {
    const {
      expedienteId,
      receptorNombre,
      receptorDni,
      observaciones,
      firmaBlob,
      entregadoPor = 'Autokeys Core',
    } = params

    const filename = `${Date.now()}-${safeName(receptorNombre || 'firma')}.png`
    const storagePath = `${expedienteId}/firmas/${filename}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, firmaBlob, {
        upsert: false,
        contentType: 'image/png',
      })

    if (uploadError) throw uploadError

    // El bucket es privado: ya no se guarda una URL "pública" permanente
    // (nunca habría funcionado, y quedaba grabada como si fuera válida para
    // siempre). Quien necesite ver la firma debe llamar a
    // EntregaService.getFirmaUrl(storagePath) para obtener una URL firmada
    // vigente en el momento de mostrarla.

    const { data: entrega, error: entregaError } = await supabase
      .from('entregas_expediente')
      .insert({
        expediente_id: expedienteId,
        receptor_nombre: receptorNombre.trim(),
        receptor_dni: receptorDni?.trim() || null,
        observaciones: observaciones?.trim() || null,
        firma_url: null,
        firma_storage_path: storagePath,
        entregado_por: entregadoPor,
      })
      .select('*')
      .single()

    if (entregaError) throw entregaError

    const { error: updateError } = await supabase
      .from('expedientes')
      .update({
        estado: 'entregado',
        fecha_entrega: new Date().toISOString().slice(0, 10),
      })
      .eq('id', expedienteId)

    if (updateError) throw updateError

    await supabase.from('expediente_historial').insert({
      expediente_id: expedienteId,
      evento: 'Vehículo entregado con firma digital',
      descripcion: `Receptor: ${receptorNombre}${receptorDni ? ` · DNI: ${receptorDni}` : ''}`,
      usuario: entregadoPor,
    })

    return entrega
  },

  async getFirmaUrl(storagePath: string) {
    return getSignedFileUrl(BUCKET, storagePath)
  },
}

export type { ExpedienteEntregaResumen }
