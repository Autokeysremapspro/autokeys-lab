import { supabase } from '@/lib/supabase'
import type { ChecklistItem } from '@/types/autokeys'

const TABLE = 'expediente_checklist'

export const ChecklistService = {
  async getByExpediente(expedienteId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as ChecklistItem[]
  },

  async createMany(expedienteId: string, items: string[]) {
    const payload = items.map((titulo, index) => ({
      expediente_id: expedienteId,
      titulo,
      orden: index + 1,
      completado: false,
    }))

    const { error } = await supabase.from(TABLE).insert(payload)
    if (error) throw error
  },

  async toggle(id: string, completado: boolean) {
    const { error } = await supabase
      .from(TABLE)
      .update({
        completado,
        completed_at: completado ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (error) throw error
  },

  async add(expedienteId: string, titulo: string, orden = 999) {
    const { error } = await supabase.from(TABLE).insert({
      expediente_id: expedienteId,
      titulo,
      orden,
      completado: false,
    })
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
