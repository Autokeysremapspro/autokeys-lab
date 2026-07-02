import { supabase } from '@/lib/supabase'
import type { FinanzasDashboard, SerieMensual, TopFinanzas } from '@/types/finanzas'

type FacturaRow = {
  id: string
  numero_documento?: string | null
  numero_factura?: string | null
  fecha?: string | null
  created_at?: string | null
  total?: number | string | null
  subtotal?: number | string | null
  iva_importe?: number | string | null
  estado?: string | null
  tipo_documento?: string | null
  cliente_id?: string | null
}

type GastoRow = {
  id: string
  fecha?: string | null
  created_at?: string | null
  concepto?: string | null
  categoria?: string | null
  proveedor?: string | null
  total?: number | string | null
  estado?: string | null
}

type PagoRow = {
  id: string
  factura_id?: string | null
  importe?: number | string | null
  fecha_pago?: string | null
  metodo_pago?: string | null
}

function money(value: any) {
  return Number(value || 0)
}

function dateKey(dateValue?: string | null) {
  const date = dateValue ? new Date(dateValue) : new Date()
  if (Number.isNaN(date.getTime())) return new Date()
  return date
}

function sameMonth(dateValue?: string | null) {
  const date = dateKey(dateValue)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function sameYear(dateValue?: string | null) {
  return dateKey(dateValue).getFullYear() === new Date().getFullYear()
}

function monthLabel(index: number) {
  return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(new Date().getFullYear(), index, 1))
}

function isFacturaValida(f: FacturaRow) {
  return f.estado !== 'cancelada' && f.tipo_documento !== 'presupuesto'
}

function isGastoValido(g: GastoRow) {
  return g.estado !== 'cancelado'
}

export async function getFinanzasDashboard(): Promise<FinanzasDashboard> {
  const [facturasRes, gastosRes, pagosRes, clientesRes] = await Promise.all([
    supabase.from('facturas').select('*'),
    supabase.from('gastos').select('*'),
    supabase.from('pagos_factura').select('*'),
    supabase.from('clientes').select('id,nombre,telefono'),
  ])

  if (facturasRes.error) throw new Error(facturasRes.error.message)
  if (gastosRes.error) throw new Error(gastosRes.error.message)

  const facturas = ((facturasRes.data || []) as FacturaRow[]).filter(isFacturaValida)
  const gastos = ((gastosRes.data || []) as GastoRow[]).filter(isGastoValido)
  const pagos = pagosRes.error ? [] : ((pagosRes.data || []) as PagoRow[])
  const clientes = clientesRes.error ? [] : ((clientesRes.data || []) as any[])
  const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre || c.telefono || 'Cliente sin nombre']))

  const facturasMes = facturas.filter((f) => sameMonth(f.fecha || f.created_at))
  const facturasAnio = facturas.filter((f) => sameYear(f.fecha || f.created_at))
  const gastosMes = gastos.filter((g) => sameMonth(g.fecha || g.created_at))
  const gastosAnio = gastos.filter((g) => sameYear(g.fecha || g.created_at))

  const ingresosMes = facturasMes.reduce((sum, f) => sum + money(f.total), 0)
  const ingresosAnio = facturasAnio.reduce((sum, f) => sum + money(f.total), 0)
  const totalGastosMes = gastosMes.reduce((sum, g) => sum + money(g.total), 0)
  const totalGastosAnio = gastosAnio.reduce((sum, g) => sum + money(g.total), 0)
  const beneficioMes = ingresosMes - totalGastosMes
  const beneficioAnio = ingresosAnio - totalGastosAnio
  const margenMes = ingresosMes > 0 ? (beneficioMes / ingresosMes) * 100 : 0
  const cobradoMes = pagos.filter((p) => sameMonth(p.fecha_pago)).reduce((sum, p) => sum + money(p.importe), 0)

  const facturasPendientes = facturas
    .filter((f) => ['pendiente', 'parcial'].includes(String(f.estado || 'pendiente')))
    .sort((a, b) => dateKey(b.fecha || b.created_at).getTime() - dateKey(a.fecha || a.created_at).getTime())
    .slice(0, 8)

  const pendienteCobro = facturasPendientes.reduce((sum, f) => sum + money(f.total), 0)

  const gastosPendientes = gastos
    .filter((g) => String(g.estado || '') === 'pendiente')
    .sort((a, b) => dateKey(b.fecha || b.created_at).getTime() - dateKey(a.fecha || a.created_at).getTime())
    .slice(0, 8)

  const pendienteGastos = gastosPendientes.reduce((sum, g) => sum + money(g.total), 0)

  const serie: SerieMensual[] = Array.from({ length: 12 }, (_, month) => {
    const ingresos = facturas
      .filter((f) => {
        const d = dateKey(f.fecha || f.created_at)
        return d.getFullYear() === new Date().getFullYear() && d.getMonth() === month
      })
      .reduce((sum, f) => sum + money(f.total), 0)

    const gastosTotal = gastos
      .filter((g) => {
        const d = dateKey(g.fecha || g.created_at)
        return d.getFullYear() === new Date().getFullYear() && d.getMonth() === month
      })
      .reduce((sum, g) => sum + money(g.total), 0)

    return {
      mes: monthLabel(month),
      ingresos,
      gastos: gastosTotal,
      beneficio: ingresos - gastosTotal,
    }
  })

  const clienteTotals = new Map<string, TopFinanzas>()
  facturas.forEach((f) => {
    const label = clienteMap.get(f.cliente_id || '') || 'Sin cliente'
    const current = clienteTotals.get(label) || { label, total: 0, count: 0 }
    current.total += money(f.total)
    current.count += 1
    clienteTotals.set(label, current)
  })

  const gastoTotals = new Map<string, TopFinanzas>()
  gastos.forEach((g) => {
    const label = g.categoria || 'otros'
    const current = gastoTotals.get(label) || { label, total: 0, count: 0 }
    current.total += money(g.total)
    current.count += 1
    gastoTotals.set(label, current)
  })

  return {
    kpi: {
      ingresosMes,
      ingresosAnio,
      gastosMes: totalGastosMes,
      gastosAnio: totalGastosAnio,
      beneficioMes,
      beneficioAnio,
      margenMes,
      pendienteCobro,
      pendienteGastos,
      cobradoMes,
    },
    serie,
    topClientes: Array.from(clienteTotals.values()).sort((a, b) => b.total - a.total).slice(0, 8),
    topGastos: Array.from(gastoTotals.values()).sort((a, b) => b.total - a.total).slice(0, 8),
    facturasPendientes,
    gastosPendientes,
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0)
}
