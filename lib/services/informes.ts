import { supabase } from '@/lib/supabase'

type AnyRow = Record<string, any>

function startOfMonthISO() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function lastMonths(count: number) {
  const months: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function money(n: number) {
  return Math.round((n || 0) * 100) / 100
}

function groupCount(rows: AnyRow[], key: string) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const value = String(row[key] || 'Sin definir')
    map.set(value, (map.get(value) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function groupSum(rows: AnyRow[], groupKey: string, sumKey: string) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const value = String(row[groupKey] || 'Sin definir')
    map.set(value, (map.get(value) || 0) + Number(row[sumKey] || 0))
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value: money(value) }))
    .sort((a, b) => b.value - a.value)
}

export type InformesOverview = {
  stats: {
    facturacionMes: number
    facturacionTotal: number
    facturasPendientes: number
    otAbiertas: number
    otTerminadas: number
    clientes: number
    vehiculos: number
    stockValorVenta: number
    stockBajo: number
    fileServicePendiente: number
    casosTecnicos: number
  }
  facturacionPorMes: { label: string; value: number }[]
  otPorEstado: { label: string; value: number }[]
  otPorTipo: { label: string; value: number }[]
  facturacionPorDocumento: { label: string; value: number }[]
  fileServicePorEstado: { label: string; value: number }[]
  stockBajo: AnyRow[]
  topClientes: { label: string; value: number }[]
}

export async function getInformesOverview(): Promise<InformesOverview> {
  const currentMonth = startOfMonthISO()
  const months = lastMonths(6)

  const [
    clientesCount,
    vehiculosCount,
    expedientesRes,
    facturasRes,
    stockRes,
    fileServiceRes,
    casosCount,
  ] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase.from('vehiculos').select('id', { count: 'exact', head: true }),
    supabase.from('expedientes').select('id,estado,tipo_trabajo,prioridad,created_at,updated_at,cliente_id'),
    supabase.from('facturas').select('id,tipo_documento,estado,total,fecha,created_at,cliente_id'),
    supabase.from('stock').select('id,tipo,referencia,descripcion,cantidad,cantidad_minima,precio_compra,precio_venta,ubicacion'),
    supabase.from('file_service').select('id,estado,precio,pagado,created_at,taller,servicio,ecu'),
    supabase.from('casos_tecnicos').select('id', { count: 'exact', head: true }),
  ])

  const firstError = [
    clientesCount.error,
    vehiculosCount.error,
    expedientesRes.error,
    facturasRes.error,
    stockRes.error,
    fileServiceRes.error,
    casosCount.error,
  ].find(Boolean)
  if (firstError) throw firstError

  const expedientes = expedientesRes.data || []
  const facturas = facturasRes.data || []
  const stock = stockRes.data || []
  const fileService = fileServiceRes.data || []

  const facturacionPorMes = months.map((m) => ({
    label: m,
    value: money(facturas
      .filter((f: AnyRow) => String(f.fecha || f.created_at || '').slice(0, 7) === m)
      .reduce((acc: number, f: AnyRow) => acc + Number(f.total || 0), 0)),
  }))

  const facturacionTotal = facturas.reduce((acc: number, f: AnyRow) => acc + Number(f.total || 0), 0)
  const facturacionMes = facturas
    .filter((f: AnyRow) => String(f.fecha || f.created_at || '') >= currentMonth)
    .reduce((acc: number, f: AnyRow) => acc + Number(f.total || 0), 0)

  const stockBajo = stock.filter((s: AnyRow) => Number(s.cantidad || 0) <= Number(s.cantidad_minima || 0))
  const stockValorVenta = stock.reduce((acc: number, s: AnyRow) => acc + Number(s.cantidad || 0) * Number(s.precio_venta || 0), 0)

  const clienteIds = Array.from(new Set(facturas.map((f: AnyRow) => f.cliente_id).filter(Boolean)))
  const clientesRel = clienteIds.length
    ? await supabase.from('clientes').select('id,nombre').in('id', clienteIds)
    : { data: [], error: null } as any
  if (clientesRel.error) throw clientesRel.error

  const clientesMap = new Map((clientesRel.data || []).map((c: AnyRow) => [c.id, c.nombre]))
  const topClientes = groupSum(
    facturas.map((f: AnyRow) => ({ ...f, cliente_nombre: clientesMap.get(f.cliente_id) || 'Sin cliente' })),
    'cliente_nombre',
    'total',
  ).slice(0, 8)

  return {
    stats: {
      facturacionMes: money(facturacionMes),
      facturacionTotal: money(facturacionTotal),
      facturasPendientes: facturas.filter((f: AnyRow) => String(f.estado || '') === 'pendiente').length,
      otAbiertas: expedientes.filter((e: AnyRow) => !['entregado', 'cancelado'].includes(String(e.estado || ''))).length,
      otTerminadas: expedientes.filter((e: AnyRow) => ['terminado', 'entregado'].includes(String(e.estado || ''))).length,
      clientes: clientesCount.count || 0,
      vehiculos: vehiculosCount.count || 0,
      stockValorVenta: money(stockValorVenta),
      stockBajo: stockBajo.length,
      fileServicePendiente: fileService.filter((f: AnyRow) => !['finalizado', 'cancelado'].includes(String(f.estado || ''))).length,
      casosTecnicos: casosCount.count || 0,
    },
    facturacionPorMes,
    otPorEstado: groupCount(expedientes, 'estado'),
    otPorTipo: groupCount(expedientes, 'tipo_trabajo').slice(0, 8),
    facturacionPorDocumento: groupSum(facturas, 'tipo_documento', 'total'),
    fileServicePorEstado: groupCount(fileService, 'estado'),
    stockBajo: stockBajo.slice(0, 10),
    topClientes,
  }
}

export const InformesService = {
  getOverview: getInformesOverview,
}
