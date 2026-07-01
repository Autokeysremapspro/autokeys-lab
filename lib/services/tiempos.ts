import { supabase } from '@/lib/supabase'
import type { TiempoTrabajo } from '@/types/autokeys'

const TABLE = 'expediente_tiempos'

export const TiempoService = {
  async getByExpediente(expedienteId: string): Promise<TiempoTrabajo[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return (data || []) as TiempoTrabajo[]
  },

  async start(expedienteId: string, usuario = 'Carlos') {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ expediente_id: expedienteId, usuario, started_at: new Date().toISOString() })
      .select('*')
      .single()

    if (error) throw error
    return data as TiempoTrabajo
  },

  async stop(id: string, notas?: string) {
    const endedAt = new Date()

    const { data: current, error: getError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (getError) throw getError

    const started = new Date(current.started_at)
    const seconds = Math.max(0, Math.round((endedAt.getTime() - started.getTime()) / 1000))

    const { error } = await supabase
      .from(TABLE)
      .update({ ended_at: endedAt.toISOString(), duration_seconds: seconds, notas })
      .eq('id', id)

    if (error) throw error
    return seconds
  },
}
