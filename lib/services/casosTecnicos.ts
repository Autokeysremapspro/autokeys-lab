import { supabase } from '@/lib/supabase'
import type { CasoTecnico } from '@/types/autokeys'

const TABLE = 'casos_tecnicos'

function normalizeTags(value?: string[] | string | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(t => String(t).trim()).filter(Boolean)
  return String(value).split(',').map(t => t.trim()).filter(Boolean)
}

export const CasosTecnicosService = {
  async getAll(): Promise<CasoTecnico[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as CasoTecnico[]
  },

  async getById(id: string): Promise<CasoTecnico | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as CasoTecnico | null
  },

  async search(term: string): Promise<CasoTecnico[]> {
    const clean = term.trim()
    if (!clean) return this.getAll()

    const pattern = `%${clean}%`
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or([
        `titulo.ilike.${pattern}`,
        `marca.ilike.${pattern}`,
        `modelo.ilike.${pattern}`,
        `motor.ilike.${pattern}`,
        `matricula.ilike.${pattern}`,
        `bastidor.ilike.${pattern}`,
        `ecu.ilike.${pattern}`,
        `hw.ilike.${pattern}`,
        `sw.ilike.${pattern}`,
        `dtc.ilike.${pattern}`,
        `sintomas.ilike.${pattern}`,
        `diagnostico.ilike.${pattern}`,
        `solucion.ilike.${pattern}`,
        `herramientas.ilike.${pattern}`,
        `archivos_resumen.ilike.${pattern}`,
      ].join(','))
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as CasoTecnico[]
  },

  async create(payload: Partial<CasoTecnico>): Promise<CasoTecnico> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        expediente_id: payload.expediente_id || null,
        cliente_id: payload.cliente_id || null,
        vehiculo_id: payload.vehiculo_id || null,
        titulo: payload.titulo,
        categoria: payload.categoria || 'averia',
        marca: payload.marca || null,
        modelo: payload.modelo || null,
        motor: payload.motor || null,
        matricula: payload.matricula || null,
        bastidor: payload.bastidor || null,
        ecu: payload.ecu || null,
        hw: payload.hw || null,
        sw: payload.sw || null,
        dtc: payload.dtc || null,
        sintomas: payload.sintomas || null,
        diagnostico: payload.diagnostico || null,
        solucion: payload.solucion || null,
        herramientas: payload.herramientas || null,
        archivos_resumen: payload.archivos_resumen || null,
        tiempo_estimado: payload.tiempo_estimado || null,
        tiempo_real: payload.tiempo_real || null,
        tags: normalizeTags(payload.tags),
        publico: !!payload.publico,
        destacado: !!payload.destacado,
        created_by: payload.created_by || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as CasoTecnico
  },

  async update(id: string, payload: Partial<CasoTecnico>): Promise<CasoTecnico> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        expediente_id: payload.expediente_id || null,
        cliente_id: payload.cliente_id || null,
        vehiculo_id: payload.vehiculo_id || null,
        titulo: payload.titulo,
        categoria: payload.categoria || 'averia',
        marca: payload.marca || null,
        modelo: payload.modelo || null,
        motor: payload.motor || null,
        matricula: payload.matricula || null,
        bastidor: payload.bastidor || null,
        ecu: payload.ecu || null,
        hw: payload.hw || null,
        sw: payload.sw || null,
        dtc: payload.dtc || null,
        sintomas: payload.sintomas || null,
        diagnostico: payload.diagnostico || null,
        solucion: payload.solucion || null,
        herramientas: payload.herramientas || null,
        archivos_resumen: payload.archivos_resumen || null,
        tiempo_estimado: payload.tiempo_estimado || null,
        tiempo_real: payload.tiempo_real || null,
        tags: normalizeTags(payload.tags),
        publico: !!payload.publico,
        destacado: !!payload.destacado,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as CasoTecnico
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
}

export function filterCasos(casos: CasoTecnico[], term: string, categoria?: string) {
  const q = term.trim().toLowerCase()
  return casos.filter(caso => {
    const matchesCategory = !categoria || categoria === 'todos' || caso.categoria === categoria
    if (!matchesCategory) return false
    if (!q) return true
    return [
      caso.titulo,
      caso.categoria,
      caso.marca,
      caso.modelo,
      caso.motor,
      caso.matricula,
      caso.bastidor,
      caso.ecu,
      caso.hw,
      caso.sw,
      caso.dtc,
      caso.sintomas,
      caso.diagnostico,
      caso.solucion,
      caso.herramientas,
      caso.archivos_resumen,
      ...(caso.tags || []),
    ].some(value => String(value || '').toLowerCase().includes(q))
  })
}
