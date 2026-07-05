import { supabase } from '@/lib/supabase'
import type { ArchivoProCategoria, ExpedienteArchivoPro } from '@/types/archivosPro'

const BUCKET = 'expediente-archivos'

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export type ArchivoProPayload = {
  expediente_id: string
  categoria: ArchivoProCategoria
  descripcion?: string
  notas?: string
  ecu?: string
  hw?: string
  sw?: string
  vin?: string
  version?: string
}

export async function listarArchivosPro(expedienteId: string) {
  const { data, error } = await supabase
    .from('expediente_archivos_pro')
    .select('*')
    .eq('expediente_id', expedienteId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as ExpedienteArchivoPro[]
}

export async function subirArchivoPro(file: File, payload: ArchivoProPayload) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${timestamp}-${safeName(file.name)}`
  const path = `${payload.expediente_id}/${payload.categoria}/${filename}`

  const upload = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (upload.error) throw new Error(upload.error.message)

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('expediente_archivos_pro')
    .insert({
      expediente_id: payload.expediente_id,
      nombre: file.name,
      categoria: payload.categoria,
      tipo_mime: file.type || null,
      tamano_bytes: file.size,
      storage_bucket: BUCKET,
      storage_path: path,
      url_publica: publicUrl?.publicUrl || null,
      descripcion: payload.descripcion || null,
      notas: payload.notas || null,
      ecu: payload.ecu || null,
      hw: payload.hw || null,
      sw: payload.sw || null,
      vin: payload.vin || null,
      version: payload.version || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ExpedienteArchivoPro
}

export async function actualizarArchivoPro(id: string, payload: Partial<ExpedienteArchivoPro>) {
  const { data, error } = await supabase
    .from('expediente_archivos_pro')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as ExpedienteArchivoPro
}

export async function eliminarArchivoPro(file: ExpedienteArchivoPro) {
  if (file.storage_path) {
    await supabase.storage.from(BUCKET).remove([file.storage_path])
  }

  const { error } = await supabase
    .from('expediente_archivos_pro')
    .delete()
    .eq('id', file.id)

  if (error) throw new Error(error.message)
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}
