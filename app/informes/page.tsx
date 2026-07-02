'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { InformesService, type InformesOverview } from '@/lib/services/informes'
import {
  BarChart3,
  ClipboardList,
  Euro,
  FileText,
  Package,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 font-semibold">{label}</p>
          <p className="text-2xl font-black mt-2">{value}</p>
          {hint && <p className="text-xs text-zinc-500 mt-2">{hint}</p>}
        </div>
        <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function SimpleBars({ title, rows, suffix = '', money = false }: any) {
  const max = useMemo(() => Math.max(1, ...rows.map((r: any) => Number(r.value || 0))), [rows])
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black">{title}</h2>
        <BarChart3 className="text-red-400" size={20} />
      </div>
      <div className="space-y-4">
        {rows.length === 0 && <p className="text-zinc-500">Sin datos todavía.</p>}
        {rows.map((row: any) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm mb-2 gap-4">
              <span className="font-semibold text-zinc-200 truncate">{row.label || 'Sin definir'}</span>
              <span className="text-zinc-400 whitespace-nowrap">{money ? formatMoney(row.value) : `${row.value}${suffix}`}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-red-600 rounded-full" style={{ width: `${Math.max(4, (Number(row.value || 0) / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InformesPage() {
  const [data, setData] = useState<InformesOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setData(await InformesService.getOverview())
      } catch (err: any) {
        setError(err?.message || 'No se pudieron cargar los informes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Autokeys Core</p>
          <h1 className="text-4xl font-black mt-1">Informes</h1>
          <p className="text-zinc-500 mt-2">Control de facturación, OT, file service, stock y rendimiento del laboratorio.</p>
        </div>
      </div>

      {loading && <div className="card p-8 text-zinc-400">Cargando informes...</div>}
      {error && <div className="card p-8 text-red-300 border-red-500/30">{error}</div>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat icon={Euro} label="Facturación mes" value={formatMoney(data.stats.facturacionMes)} hint="Documentos del mes actual" />
            <Stat icon={TrendingUp} label="Facturación total" value={formatMoney(data.stats.facturacionTotal)} hint={`${data.stats.facturasPendientes} pendientes de cobro`} />
            <Stat icon={ClipboardList} label="OT abiertas" value={data.stats.otAbiertas} hint={`${data.stats.otTerminadas} terminadas/entregadas`} />
            <Stat icon={Package} label="Valor stock venta" value={formatMoney(data.stats.stockValorVenta)} hint={`${data.stats.stockBajo} referencias bajo mínimo`} />
            <Stat icon={Users} label="Clientes" value={data.stats.clientes} hint={`${data.stats.vehiculos} vehículos registrados`} />
            <Stat icon={Wrench} label="File Service activo" value={data.stats.fileServicePendiente} hint="Pendiente, revisión o en proceso" />
            <Stat icon={FileText} label="Casos técnicos" value={data.stats.casosTecnicos} hint="Biblioteca de conocimiento" />
            <Stat icon={BarChart3} label="Módulos activos" value="ERP" hint="Core, laboratorio y administración" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SimpleBars title="Facturación últimos 6 meses" rows={data.facturacionPorMes} money />
            <SimpleBars title="Top clientes por facturación" rows={data.topClientes} money />
            <SimpleBars title="OT por estado" rows={data.otPorEstado} />
            <SimpleBars title="OT por tipo de trabajo" rows={data.otPorTipo} />
            <SimpleBars title="Facturación por documento" rows={data.facturacionPorDocumento} money />
            <SimpleBars title="File Service por estado" rows={data.fileServicePorEstado} />
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black">Stock bajo</h2>
              <Package className="text-red-400" size={20} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-500 text-left">
                  <tr>
                    <th className="py-3">Referencia</th>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.stockBajo.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-zinc-500">No hay referencias bajo mínimo.</td></tr>
                  )}
                  {data.stockBajo.map((item: any) => (
                    <tr key={item.id} className="text-zinc-300">
                      <td className="py-4 font-bold">{item.referencia || '-'}</td>
                      <td>{item.descripcion}</td>
                      <td>{item.tipo}</td>
                      <td>{item.ubicacion || '-'}</td>
                      <td className="text-right text-red-300 font-bold">{item.cantidad ?? 0}</td>
                      <td className="text-right">{item.cantidad_minima ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
