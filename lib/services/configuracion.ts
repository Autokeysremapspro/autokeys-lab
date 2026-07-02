import { supabase } from '@/lib/supabase'

export type ConfiguracionEmpresa = {
  id: string
  nombre_comercial: string | null
  razon_social: string | null
  cif: string | null
  direccion: string | null
  codigo_postal: string | null
  poblacion: string | null
  provincia: string | null
  telefono: string | null
  email: string | null
  web: string | null
  logo_url: string | null
  iva_defecto: number | null
  prefijo_ot: string | null
  prefijo_factura: string | null
  prefijo_presupuesto: string | null
  prefijo_albaran: string | null
  prefijo_ticket: string | null
  texto_pie_factura: string | null
  texto_garantia: string | null
  created_at?: string
  updated_at?: string
}

export async function getConfiguracionEmpresa(): Promise<ConfiguracionEmpresa | null> {
  const { data, error } = await supabase
    .from('configuracion_empresa')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as ConfiguracionEmpresa | null
}

export async function saveConfiguracionEmpresa(values: Partial<ConfiguracionEmpresa>) {
  const current = await getConfiguracionEmpresa()

  if (current?.id) {
    const { data, error } = await supabase
      .from('configuracion_empresa')
      .update(values)
      .eq('id', current.id)
      .select('*')
      .single()

    if (error) throw error
    return data as ConfiguracionEmpresa
  }

  const { data, error } = await supabase
    .from('configuracion_empresa')
    .insert(values)
    .select('*')
    .single()

  if (error) throw error
  return data as ConfiguracionEmpresa
}
