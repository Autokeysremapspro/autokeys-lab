import { supabase } from '@/lib/supabase'
import type { ArchivoExpediente } from '@/types/autokeys'

const BUCKET = 'autokeys-expedientes'
const TABLE = 'archivos_expediente'

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const ArchivoService = {
  async list(expedienteId: string, mode?: 'archivos' | 'fotos'): Promise<ArchivoExpediente[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('created_at', { ascending: false })

    if (mode === 'fotos') {
      query = query.like('tipo', 'foto_%')
    }

    if (mode === 'archivos') {
      query = query.not('tipo', 'like', 'foto_%')
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as ArchivoExpediente[]
  },

  async upload(params: {
    expedienteId: string
    file: File
    tipo: string
    notas?: string
  }): Promise<ArchivoExpediente> {
    const { expedienteId, file, tipo, notas } = params
    const filename = safeName(file.name || 'archivo')
    const storagePath = `${expedienteId}/${tipo}/${Date.now()}-${filename}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: false, contentType: file.type || undefined })

    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    const record = {
      expediente_id: expedienteId,
      nombre_archivo: file.name,
      tipo,
      url: publicData.publicUrl,
      notas: notas || null,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size || null,
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert(record)
      .select('*')
      .single()

    if (error) throw error
    return data as ArchivoExpediente
  },

  async remove(file: ArchivoExpediente) {
    if (file.storage_path) {
      await supabase.storage.from(BUCKET).remove([file.storage_path])
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', file.id)
    if (error) throw error
  },
}
