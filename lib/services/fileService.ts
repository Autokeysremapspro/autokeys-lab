import { supabase } from '@/lib/supabase'
import type { FileServiceJob } from '@/types/autokeys'

export type FileServicePayload = Partial<FileServiceJob>

export async function getFileServiceJobs(): Promise<FileServiceJob[]> {
  const { data, error } = await supabase
    .from('file_service')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as FileServiceJob[]
}

export async function createFileServiceJob(payload: FileServicePayload): Promise<FileServiceJob> {
  const { data, error } = await supabase
    .from('file_service')
    .insert({
      taller: payload.taller || null,
      marca: payload.marca || null,
      modelo: payload.modelo || null,
      motor: payload.motor || null,
      matricula: payload.matricula || null,
      ecu: payload.ecu || null,
      hw: payload.hw || null,
      sw: payload.sw || null,
      servicio: payload.servicio || 'Stage 1',
      estado: payload.estado || 'pendiente',
      precio: Number(payload.precio || 0),
      pagado: Boolean(payload.pagado || false),
      notas: payload.notas || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as FileServiceJob
}

export async function updateFileServiceJob(id: string, payload: FileServicePayload): Promise<FileServiceJob> {
  const { data, error } = await supabase
    .from('file_service')
    .update({
      taller: payload.taller || null,
      marca: payload.marca || null,
      modelo: payload.modelo || null,
      motor: payload.motor || null,
      matricula: payload.matricula || null,
      ecu: payload.ecu || null,
      hw: payload.hw || null,
      sw: payload.sw || null,
      servicio: payload.servicio || 'Stage 1',
      estado: payload.estado || 'pendiente',
      precio: Number(payload.precio || 0),
      pagado: Boolean(payload.pagado || false),
      notas: payload.notas || null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as FileServiceJob
}

export async function deleteFileServiceJob(id: string): Promise<void> {
  const { error } = await supabase.from('file_service').delete().eq('id', id)
  if (error) throw error
}

export function filterFileServiceJobs(jobs: FileServiceJob[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return jobs

  return jobs.filter((job) => {
    const values = [
      job.taller,
      job.marca,
      job.modelo,
      job.motor,
      job.matricula,
      job.ecu,
      job.hw,
      job.sw,
      job.servicio,
      job.estado,
      job.notas,
    ]

    return values.some((value) => String(value || '').toLowerCase().includes(q))
  })
}
