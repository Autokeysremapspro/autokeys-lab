import { supabase } from '@/lib/supabase'

export type ObjetivoKpi = {
  id?: string
  periodo: 'mensual' | 'anual'
  anio: number
  mes?: number | null
  objetivo_facturacion?: number | null
  objetivo_beneficio?: number | null
  objetivo_file_service?: number | null
  objetivo_ot_terminadas?: number | null
  notas?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type KpiResumen = {
  ingresosMes: number
  gastosMes: number
  beneficioMes: number
  margenMes: number
  fileServiceMes: number
  otTerminadasMes: number
  pendienteCobro: number
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
}

function num(value: any) {
  return Number(value || 0)
}

export async function getObjetivoActual() {
  const now = new Date()
  const anio = now.getFullYear()
  const mes = now.getMonth() + 1

  const { data, error } = await supabase
    .from('objetivos_kpis')
    .select('*')
    .eq('periodo', 'mensual')
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return data as ObjetivoKpi | null
}

export async function guardarObjetivoActual(payload: Partial<ObjetivoKpi>) {
  const now = new Date()
  const anio = now.getFullYear()
  const mes = now.getMonth() + 1

  const row = {
    periodo: 'mensual',
    anio,
    mes,
    objetivo_facturacion: payload.objetivo_facturacion || 0,
    objetivo_beneficio: payload.objetivo_beneficio || 0,
    objetivo_file_service: payload.objetivo_file_service || 0,
    objetivo_ot_terminadas: payload.objetivo_ot_terminadas || 0,
    notas: payload.notas || null,
  }

  const { data, error } = await supabase
    .from('objetivos_kpis')
    .upsert(row, { onConflict: 'periodo,anio,mes' })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  return data as ObjetivoKpi
}

export async function getKpiResumenActual(): Promise<KpiResumen> {
  const from = startOfMonth()
  const to = endOfMonth()

  const [facturasRes, gastosRes, fileServiceRes, expedientesRes] = await Promise.all([
    supabase.from('facturas').select('*').gte('created_at', from).lte('created_at', to),
    supabase.from('gastos').select('*').gte('created_at', from).lte('created_at', to),
    supabase.from('file_service').select('*').gte('created_at', from).lte('created_at', to),
    supabase.from('expedientes').select('*').gte('updated_at', from).lte('updated_at', to),
  ])

  if (facturasRes.error) throw new Error(facturasRes.error.message)
  if (gastosRes.error) throw new Error(gastosRes.error.message)
  if (fileServiceRes.error) throw new Error(fileServiceRes.error.message)
  if (expedientesRes.error) throw new Error(expedientesRes.error.message)

  const facturas = facturasRes.data || []
  const gastos = gastosRes.data || []
  const fileService = fileServiceRes.data || []
  const expedientes = expedientesRes.data || []

  const ingresosMes = facturas
    .filter((f: any) => f.estado !== 'cancelada')
    .reduce((acc: number, f: any) => acc + num(f.total), 0)

  const pendienteCobro = facturas
    .filter((f: any) => f.estado === 'pendiente' || f.estado === 'parcial')
    .reduce((acc: number, f: any) => acc + num(f.total), 0)

  const gastosMes = gastos
    .filter((g: any) => g.estado !== 'cancelado')
    .reduce((acc: number, g: any) => acc + num(g.total || g.importe_total || g.importe), 0)

  const beneficioMes = ingresosMes - gastosMes
  const margenMes = ingresosMes > 0 ? (beneficioMes / ingresosMes) * 100 : 0

  const fileServiceMes = fileService.length
  const otTerminadasMes = expedientes.filter((e: any) => e.estado === 'terminado' || e.estado === 'entregado').length

  return {
    ingresosMes,
    gastosMes,
    beneficioMes,
    margenMes,
    fileServiceMes,
    otTerminadasMes,
    pendienteCobro,
  }
}
