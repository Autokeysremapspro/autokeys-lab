import { supabase } from '@/lib/supabase'
import type { AuditoriaEvento, AuditoriaEventoInput } from '@/types/auditoria'

export type AuditoriaFilters = {
  search?: string
  modulo?: string
  severidad?: string
  limit?: number
}

export async function getAuditoriaEventos(filters: AuditoriaFilters = {}): Promise<AuditoriaEvento[]> {
  let query = supabase
    .from('auditoria_eventos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 200)

  if (filters.modulo && filters.modulo !== 'todos') {
    query = query.eq('modulo', filters.modulo)
  }

  if (filters.severidad && filters.severidad !== 'todas') {
    query = query.eq('severidad', filters.severidad)
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim()
    query = query.or([
      `accion.ilike.%${s}%`,
      `modulo.ilike.%${s}%`,
      `usuario_nombre.ilike.%${s}%`,
      `usuario_email.ilike.%${s}%`,
      `entidad_resumen.ilike.%${s}%`,
      `descripcion.ilike.%${s}%`,
    ].join(','))
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as AuditoriaEvento[]
}

export async function createAuditoriaEvento(input: AuditoriaEventoInput) {
  const { data, error } = await supabase
    .from('auditoria_eventos')
    .insert({
      severidad: 'info',
      ...input,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function getAuditoriaStats() {
  const since = new Date()
  since.setHours(0, 0, 0, 0)

  const [total, hoy, danger, warning] = await Promise.all([
    supabase.from('auditoria_eventos').select('id', { count: 'exact', head: true }),
    supabase.from('auditoria_eventos').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString()),
    supabase.from('auditoria_eventos').select('id', { count: 'exact', head: true }).eq('severidad', 'danger'),
    supabase.from('auditoria_eventos').select('id', { count: 'exact', head: true }).eq('severidad', 'warning'),
  ])

  if (total.error) throw total.error
  if (hoy.error) throw hoy.error
  if (danger.error) throw danger.error
  if (warning.error) throw warning.error

  return {
    total: total.count || 0,
    hoy: hoy.count || 0,
    danger: danger.count || 0,
    warning: warning.count || 0,
  }
}
