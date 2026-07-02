'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { getFinanzasDashboard, formatCurrency } from '@/lib/services/finanzas'
import type { FinanzasDashboard } from '@/types/finanzas'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CreditCard,
  Euro,
  Loader2,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'

function Stat({ title, value, subtitle, icon: Icon, tone = 'default' }: any) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-400 border-emerald-500/20'
      : tone === 'bad'
        ? 'text-red-400 border-red-500/20'
        : tone === 'warn'
          ? 'text-amber-400 border-amber-500/20'
          : 'text-zinc-300 border-white/10'

  return (
    <div className={`card p-5 border ${toneClass}`}>
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-sm font-black uppercase tracking-wider">{title}</span>
        <Icon size={21} className={toneClass.split(' ')[0]} />
      </div>
      <div className="text-3xl font-black mt-3">{value}</div>
      {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-zinc-500">{children}</div>
}

export default function FinanzasPage() {
  const [data, setData] = useState<FinanzasDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await getFinanzasDashboard())
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las finanzas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const maxSerie = useMemo(() => {
    if (!data) return 1
    return Math.max(...data.serie.map((s) => Math.max(s.ingresos, s.gastos, Math.abs(s.beneficio))), 1)
  }, [data])

  if (loading) {
    return (
      <AppShell>
        <div className="card p-8 flex items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin" /> Cargando finanzas...
        </div>
      </AppShell>
    )
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="card p-8 border border-red-500/30 text-red-300">
          {error || 'No hay datos financieros disponibles'}
        </div>
      </AppShell>
    )
  }

  const kpi = data.kpi

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Autokeys Core · Finanzas</p>
            <h2 className="text-4xl font-black mt-1">Rentabilidad del laboratorio</h2>
            <p className="text-zinc-500 mt-2">Ingresos, gastos, cobros pendientes y beneficio real.</p>
          </div>
          <button onClick={load} className="btn btn-dark flex items-center gap-2 w-fit">
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Stat title="Ingresos mes" value={formatCurrency(kpi.ingresosMes)} subtitle={`Año: ${formatCurrency(kpi.ingresosAnio)}`} icon={ArrowUpRight} tone="good" />
          <Stat title="Gastos mes" value={formatCurrency(kpi.gastosMes)} subtitle={`Año: ${formatCurrency(kpi.gastosAnio)}`} icon={ArrowDownRight} tone="bad" />
          <Stat title="Beneficio mes" value={formatCurrency(kpi.beneficioMes)} subtitle={`Margen: ${kpi.margenMes.toFixed(1)} %`} icon={PiggyBank} tone={kpi.beneficioMes >= 0 ? 'good' : 'bad'} />
          <Stat title="Cobrado mes" value={formatCurrency(kpi.cobradoMes)} subtitle="Según pagos registrados" icon={CreditCard} tone="default" />
          <Stat title="Pendiente cobro" value={formatCurrency(kpi.pendienteCobro)} subtitle="Facturas pendientes/parciales" icon={Banknote} tone="warn" />
          <Stat title="Gastos pendientes" value={formatCurrency(kpi.pendienteGastos)} subtitle="Compras sin pagar" icon={AlertTriangle} tone="warn" />
          <Stat title="Beneficio anual" value={formatCurrency(kpi.beneficioAnio)} subtitle="Ingresos - gastos" icon={TrendingUp} tone={kpi.beneficioAnio >= 0 ? 'good' : 'bad'} />
          <Stat title="Control financiero" value="Activo" subtitle="Datos enlazados con ERP" icon={BarChart3} tone="default" />
        </div>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black">Evolución mensual</h3>
              <p className="text-zinc-500 mt-1">Ingresos, gastos y beneficio del año actual.</p>
            </div>
            <Euro className="text-red-400" />
          </div>

          <div className="space-y-4">
            {data.serie.map((item) => (
              <div key={item.mes} className="grid grid-cols-[70px_1fr] gap-4 items-center">
                <div className="font-black uppercase text-zinc-400">{item.mes}</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-xs text-emerald-400 font-bold">Ingresos</span>
                    <div className="h-3 rounded-full bg-white/5 flex-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(2, (item.ingresos / maxSerie) * 100)}%` }} />
                    </div>
                    <span className="w-28 text-right text-sm text-zinc-400">{formatCurrency(item.ingresos)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-20 text-xs text-red-400 font-bold">Gastos</span>
                    <div className="h-3 rounded-full bg-white/5 flex-1 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.max(2, (item.gastos / maxSerie) * 100)}%` }} />
                    </div>
                    <span className="w-28 text-right text-sm text-zinc-400">{formatCurrency(item.gastos)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="card p-6">
            <h3 className="text-2xl font-black mb-1">Top clientes por facturación</h3>
            <p className="text-zinc-500 mb-5">Clientes con más volumen registrado.</p>
            {data.topClientes.length === 0 ? <Empty>Sin facturación todavía.</Empty> : (
              <div className="space-y-3">
                {data.topClientes.map((item, index) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-500 font-black uppercase">#{index + 1} · {item.count} documentos</div>
                      <div className="font-black text-lg">{item.label}</div>
                    </div>
                    <div className="text-emerald-400 font-black">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <h3 className="text-2xl font-black mb-1">Gastos por categoría</h3>
            <p className="text-zinc-500 mb-5">Dónde se está yendo el dinero.</p>
            {data.topGastos.length === 0 ? <Empty>Sin gastos registrados.</Empty> : (
              <div className="space-y-3">
                {data.topGastos.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-500 font-black uppercase">{item.count} movimientos</div>
                      <div className="font-black text-lg capitalize">{item.label}</div>
                    </div>
                    <div className="text-red-300 font-black">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="card p-6">
            <h3 className="text-2xl font-black mb-1">Facturas pendientes</h3>
            <p className="text-zinc-500 mb-5">Cobros que conviene revisar.</p>
            {data.facturasPendientes.length === 0 ? <Empty>No hay facturas pendientes.</Empty> : (
              <div className="space-y-3">
                {data.facturasPendientes.map((f: any) => (
                  <div key={f.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black">{f.numero_documento || f.numero_factura || 'Factura'}</div>
                      <div className="text-sm text-zinc-500">Estado: {f.estado || 'pendiente'}</div>
                    </div>
                    <div className="text-amber-300 font-black">{formatCurrency(Number(f.total || 0))}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <h3 className="text-2xl font-black mb-1">Gastos pendientes</h3>
            <p className="text-zinc-500 mb-5">Compras o recibos pendientes de pago.</p>
            {data.gastosPendientes.length === 0 ? <Empty>No hay gastos pendientes.</Empty> : (
              <div className="space-y-3">
                {data.gastosPendientes.map((g: any) => (
                  <div key={g.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black">{g.concepto || 'Gasto'}</div>
                      <div className="text-sm text-zinc-500">{g.proveedor || g.categoria || 'Sin proveedor'}</div>
                    </div>
                    <div className="text-red-300 font-black">{formatCurrency(Number(g.total || 0))}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
