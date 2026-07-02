import { supabase } from '@/lib/supabase'

export type TipoDocumentoPlantilla = 'factura' | 'presupuesto' | 'albaran' | 'ticket'

export type PlantillaDocumento = {
  id?: string
  tipo_documento: TipoDocumentoPlantilla | string
  nombre: string
  color_principal?: string | null
  mostrar_logo?: boolean | null
  mostrar_sello?: boolean | null
  texto_cabecera?: string | null
  texto_pie?: string | null
  condiciones_legales?: string | null
  garantia?: string | null
  observaciones_defecto?: string | null
  formato?: string | null
  activo?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export async function getPlantillasDocumentos() {
  const { data, error } = await supabase
    .from('plantillas_documentos')
    .select('*')
    .order('tipo_documento', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as PlantillaDocumento[]
}

export async function updatePlantillaDocumento(id: string, payload: Partial<PlantillaDocumento>) {
  const { data, error } = await supabase
    .from('plantillas_documentos')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as PlantillaDocumento
}

export async function crearPlantillaDocumento(payload: PlantillaDocumento) {
  const { data, error } = await supabase
    .from('plantillas_documentos')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data as PlantillaDocumento
}

export function nombreTipoDocumento(tipo: string) {
  const map: Record<string, string> = {
    factura: 'Factura',
    presupuesto: 'Presupuesto',
    albaran: 'Albarán',
    ticket: 'Ticket',
  }
  return map[tipo] || tipo
}
