import { supabase } from '@/lib/supabase'

export type DashboardOverview = {
  stats: {
    otAbiertas: number
    terminadasHoy: number
    urgentes: number
    pendientesCobro: number
    clientes: number
    vehiculos: number
    fileServiceActivos: number
    stockBajo: number
    facturacionHoy: number
    facturacionMes: number
  }
  ultimosExpedientes: any[]
  ultimosClientes: any[]
  stockBajo: any[]
  fileService: any[]
  actividad: number[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function monthStartISO() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function lastDays(count: number) {
  const days: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(dayKey(d))
  }
  return days
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const today = todayISO()
  const month = monthStartISO()
  const activityDays = lastDays(12)
  const firstActivityDay = activityDays[0]

  const [
    clientesCount,
    vehiculosCount,
    expedientesRes,
    ultimosExpedientesRes,
    ultimosClientesRes,
    stockRes,
    facturasRes,
    fileServiceRes,
    actividadRes,
  ] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase.from('vehiculos').select('id', { count: 'exact', head: true }),
    supabase.from('expedientes').select('id,estado,prioridad,updated_at,created_at'),
    supabase
      .from('expedientes')
      .select('id,numero_ot,tipo_trabajo,estado,prioridad,precio_final,precio_estimado,cliente_id,vehiculo_id,created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('clientes')
      .select('id,nombre,telefono,email,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('stock')
      .select('id,tipo,referencia,descripcion,cantidad,cantidad_minima,ubicacion')
      .order('cantidad', { ascending: true })
      .limit(50),
    supabase
      .from('facturas')
      .select('id,total,estado,fecha,created_at'),
    supabase
      .from('file_service')
      .select('id,taller,matricula,ecu,servicio,estado,precio,pagado,created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('expedientes')
      .select('id,created_at')
      .gte('created_at', `${firstActivityDay}T00:00:00`),
  ])

  const errors = [clientesCount.error, vehiculosCount.error, expedientesRes.error, ultimosExpedientesRes.error, ultimosClientesRes.error, stockRes.error, facturasRes.error, fileServiceRes.error, actividadRes.error].filter(Boolean)
  if (errors.length) throw errors[0]

  const expedientes = expedientesRes.data || []
  const facturas = facturasRes.data || []
  const fileService = fileServiceRes.data || []
  const lowStock = (stockRes.data || []).filter((s: any) => Number(s.cantidad || 0) <= Number(s.cantidad_minima || 0))

  const clienteIds = Array.from(new Set((ultimosExpedientesRes.data || []).map((e: any) => e.cliente_id).filter(Boolean)))
  const vehiculoIds = Array.from(new Set((ultimosExpedientesRes.data || []).map((e: any) => e.vehiculo_id).filter(Boolean)))

  const [clientesRel, vehiculosRel] = await Promise.all([
    clienteIds.length
      ? supabase.from('clientes').select('id,nombre,telefono').in('id', clienteIds)
      : Promise.resolve({ data: [], error: null } as any),
    vehiculoIds.length
      ? supabase.from('vehiculos').select('id,marca,modelo,matricula,ecu').in('id', vehiculoIds)
      : Promise.resolve({ data: [], error: null } as any),
  ])

  if (clientesRel.error) throw clientesRel.error
  if (vehiculosRel.error) throw vehiculosRel.error

  const clientesMap = new Map((clientesRel.data || []).map((c: any) => [c.id, c]))
  const vehiculosMap = new Map((vehiculosRel.data || []).map((v: any) => [v.id, v]))

  const ultimosExpedientes = (ultimosExpedientesRes.data || []).map((e: any) => ({
    ...e,
    cliente: e.cliente_id ? clientesMap.get(e.cliente_id) || null : null,
    vehiculo: e.vehiculo_id ? vehiculosMap.get(e.vehiculo_id) || null : null,
  }))

  const actividadCounts = new Map(activityDays.map((d) => [d, 0]))
  for (const row of actividadRes.data || []) {
    const k = String(row.created_at || '').slice(0, 10)
    if (actividadCounts.has(k)) actividadCounts.set(k, (actividadCounts.get(k) || 0) + 1)
  }
  const max = Math.max(1, ...Array.from(actividadCounts.values()))
  const actividad = activityDays.map((d) => Math.max(12, Math.round(((actividadCounts.get(d) || 0) / max) * 100)))

  return {
    stats: {
      otAbiertas: expedientes.filter((e: any) => !['entregado', 'cancelado'].includes(String(e.estado))).length,
      terminadasHoy: expedientes.filter((e: any) => e.estado === 'terminado' && String(e.updated_at || e.created_at || '').startsWith(today)).length,
      urgentes: expedientes.filter((e: any) => e.prioridad === 'urgente' && !['entregado', 'cancelado'].includes(String(e.estado))).length,
      pendientesCobro: facturas.filter((f: any) => f.estado === 'pendiente').length,
      clientes: clientesCount.count || 0,
      vehiculos: vehiculosCount.count || 0,
      fileServiceActivos: fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).length,
      stockBajo: lowStock.length,
      facturacionHoy: facturas.filter((f: any) => String(f.fecha || f.created_at || '').startsWith(today)).reduce((a: number, f: any) => a + Number(f.total || 0), 0),
      facturacionMes: facturas.filter((f: any) => String(f.fecha || f.created_at || '') >= month).reduce((a: number, f: any) => a + Number(f.total || 0), 0),
    },
    ultimosExpedientes,
    ultimosClientes: ultimosClientesRes.data || [],
    stockBajo: lowStock.slice(0, 8),
    fileService,
    actividad,
  }
}

export const DashboardService = {
  getOverview: getDashboardOverview,
}
