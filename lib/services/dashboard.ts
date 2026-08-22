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
    fileServiceTotal: number
    stockBajo: number
    facturacionHoy: number
    facturacionMes: number
  }
  ultimosExpedientes: any[]
  ultimosClientes: any[]
  stockBajo: any[]
  stockDestacado: any[]
  fileService: any[]
  actividad: number[]
  tipoTrabajo: { label: string; value: number }[]
  agendaHoy: any[]
  fichaCliente: any | null
  fichaVehiculo: any | null
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

  const dayStart = `${today}T00:00:00`
  const dayEnd = `${today}T23:59:59`

  const [
    clientesCount,
    vehiculosCount,
    expedientesRes,
    ultimosExpedientesRes,
    ultimosClientesRes,
    stockRes,
    facturasRes,
    fileServiceRes,
    fileServiceCountRes,
    actividadRes,
    agendaHoyRes,
    ultimoClienteRes,
    ultimoVehiculoRes,
  ] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase.from('vehiculos').select('id', { count: 'exact', head: true }),
    supabase.from('expedientes').select('id,estado,prioridad,tipo_trabajo,updated_at,created_at'),
    supabase
      .from('expedientes')
      .select('id,numero_ot,tipo_trabajo,estado,prioridad,tecnico,precio_final,precio_estimado,cliente_id,vehiculo_id,created_at')
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
    supabase.from('file_service').select('id', { count: 'exact', head: true }),
    supabase
      .from('expedientes')
      .select('id,created_at')
      .gte('created_at', `${firstActivityDay}T00:00:00`),
    supabase
      .from('agenda_eventos')
      .select('id,titulo,tipo,estado,fecha_inicio,cliente:cliente_id(id,nombre),vehiculo:vehiculo_id(id,marca,modelo,matricula)')
      .gte('fecha_inicio', dayStart)
      .lte('fecha_inicio', dayEnd)
      .order('fecha_inicio', { ascending: true })
      .limit(8),
    supabase.from('clientes').select('id,nombre,telefono,email,poblacion,created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('vehiculos').select('id,marca,modelo,matricula,bastidor,motor,anio,cliente_id,cliente:cliente_id(id,nombre)').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const errors = [clientesCount.error, vehiculosCount.error, expedientesRes.error, ultimosExpedientesRes.error, ultimosClientesRes.error, stockRes.error, facturasRes.error, fileServiceRes.error, fileServiceCountRes.error, actividadRes.error, agendaHoyRes.error, ultimoClienteRes.error, ultimoVehiculoRes.error].filter(Boolean)
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

  const tipoTrabajoCounts = new Map<string, number>()
  for (const e of expedientes as any[]) {
    const label = String(e.tipo_trabajo || 'Otros')
    tipoTrabajoCounts.set(label, (tipoTrabajoCounts.get(label) || 0) + 1)
  }
  const tipoTrabajo = Array.from(tipoTrabajoCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const stockDestacado = [...(stockRes.data || [])]
    .sort((a: any, b: any) => Number(b.cantidad || 0) - Number(a.cantidad || 0))
    .slice(0, 5)

  const clienteLatest = ultimoClienteRes.data as any
  let fichaCliente: any = null
  if (clienteLatest) {
    const [vRes, eRes, fRes] = await Promise.all([
      supabase.from('vehiculos').select('id', { count: 'exact', head: true }).eq('cliente_id', clienteLatest.id),
      supabase.from('expedientes').select('id', { count: 'exact', head: true }).eq('cliente_id', clienteLatest.id),
      supabase.from('facturas').select('total').eq('cliente_id', clienteLatest.id),
    ])
    fichaCliente = {
      ...clienteLatest,
      vehiculosCount: vRes.count || 0,
      ordenesCount: eRes.count || 0,
      gastoTotal: (fRes.data || []).reduce((a: number, f: any) => a + Number(f.total || 0), 0),
    }
  }

  return {
    stats: {
      otAbiertas: expedientes.filter((e: any) => !['entregado', 'cancelado'].includes(String(e.estado))).length,
      terminadasHoy: expedientes.filter((e: any) => e.estado === 'terminado' && String(e.updated_at || e.created_at || '').startsWith(today)).length,
      urgentes: expedientes.filter((e: any) => e.prioridad === 'urgente' && !['entregado', 'cancelado'].includes(String(e.estado))).length,
      pendientesCobro: facturas.filter((f: any) => f.estado === 'pendiente').length,
      clientes: clientesCount.count || 0,
      vehiculos: vehiculosCount.count || 0,
      fileServiceActivos: fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).length,
      fileServiceTotal: fileServiceCountRes.count || 0,
      stockBajo: lowStock.length,
      facturacionHoy: facturas.filter((f: any) => String(f.fecha || f.created_at || '').startsWith(today)).reduce((a: number, f: any) => a + Number(f.total || 0), 0),
      facturacionMes: facturas.filter((f: any) => String(f.fecha || f.created_at || '') >= month).reduce((a: number, f: any) => a + Number(f.total || 0), 0),
    },
    ultimosExpedientes,
    ultimosClientes: ultimosClientesRes.data || [],
    stockBajo: lowStock.slice(0, 8),
    stockDestacado,
    fileService,
    actividad,
    tipoTrabajo,
    agendaHoy: agendaHoyRes.data || [],
    fichaCliente,
    fichaVehiculo: ultimoVehiculoRes.data || null,
  }
}

export const DashboardService = {
  getOverview: getDashboardOverview,
}
