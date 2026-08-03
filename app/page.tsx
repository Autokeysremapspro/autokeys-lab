'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import StatCard from '@/components/StatCard'
import QuickAction from '@/components/QuickAction'
import DataTable from '@/components/DataTable'
import { getDashboardOverview, type DashboardOverview } from '@/lib/services/dashboard'
import { statusClass, money } from '@/lib/status'
import { AlertTriangle, Car, ClipboardList, Euro, FileText, Package, PlusCircle, RefreshCw, UploadCloud, Users } from 'lucide-react'

const emptyOverview: DashboardOverview = {
  stats: {
    otAbiertas: 0,
    terminadasHoy: 0,
    urgentes: 0,
    pendientesCobro: 0,
    clientes: 0,
    vehiculos: 0,
    fileServiceActivos: 0,
    stockBajo: 0,
    facturacionHoy: 0,
    facturacionMes: 0,
  },
  ultimosExpedientes: [],
  ultimosClientes: [],
  stockBajo: [],
  fileService: [],
  actividad: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
}

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardOverview()
      setOverview(data)
    } catch (err: any) {
      setError(err?.message || 'Error cargando dashboard')
    } finally {
      setLoading(false)
    }
  }

  const { stats } = overview

  return (
    <AppShell>
      <div className="ak-mission-hero mb-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-[28px] p-6 lg:p-7">
        <div>
          <div className="mb-3 flex items-center gap-3"><span className="ak-core-live-dot"/><p className="ak-mono text-[11px] text-[#ffb870] font-bold uppercase tracking-[0.22em]">Mission Control · Sistema operativo</p></div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-[-.035em]">Centro de operaciones Autokeys</h2>
          <p className="text-zinc-400 mt-2 max-w-3xl">Control en tiempo real del laboratorio, expedientes, producción, stock y AK Cloud.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-dark flex items-center justify-center gap-2">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-[#8a4a1f]/50 bg-[#8a4a1f]/20 p-4 text-[#ffb870]">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="OT abiertas" value={stats.otAbiertas} subtitle="Trabajos activos" icon={<ClipboardList size={20} />} tone="copper" />
        <StatCard title="Terminadas hoy" value={stats.terminadasHoy} subtitle="Listas para entrega" icon={<Car size={20} />} tone="green" />
        <StatCard title="Facturación hoy" value={money(stats.facturacionHoy)} subtitle={`Mes: ${money(stats.facturacionMes)}`} icon={<Euro size={20} />} tone="blue" />
        <StatCard title="File Service" value={stats.fileServiceActivos} subtitle="Archivos activos" icon={<UploadCloud size={20} />} tone="amber" />
        <StatCard title="Urgentes" value={stats.urgentes} subtitle="Prioridad urgente" icon={<AlertTriangle size={20} />} tone="red" />
        <StatCard title="Pendientes cobro" value={stats.pendientesCobro} subtitle="Documentos pendientes" icon={<FileText size={20} />} tone="amber" />
        <StatCard title="Clientes" value={stats.clientes} subtitle={`${stats.vehiculos} vehículos registrados`} icon={<Users size={20} />} tone="zinc" />
        <StatCard title="Stock bajo" value={stats.stockBajo} subtitle="Revisar material" icon={<Package size={20} />} tone="red" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Últimos expedientes</h2>
              <p className="text-sm text-zinc-500">Actividad reciente del laboratorio</p>
            </div>
          </div>
          <DataTable columns={['OT', 'Cliente', 'Vehículo', 'Trabajo', 'Estado', 'Importe']} rows={overview.ultimosExpedientes.map((o: any) => [
            <a href={`/expedientes/${o.id}`} className="font-bold hover:text-[#ffb870]">{o.numero_ot}</a>,
            o.cliente?.nombre || '-',
            `${o.vehiculo?.marca || ''} ${o.vehiculo?.modelo || ''} ${o.vehiculo?.matricula || ''}`.trim() || '-',
            o.tipo_trabajo,
            <span className={`badge ${statusClass(o.estado)}`}>{o.estado || 'recibido'}</span>,
            money(o.precio_final || o.precio_estimado),
          ])} />
          {!loading && overview.ultimosExpedientes.length === 0 && <p className="text-zinc-500 mt-4">Todavía no hay expedientes.</p>}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-xl font-bold">Acciones rápidas</h2>
            <p className="text-sm text-zinc-500 mb-4">Crear trabajo, cliente o material</p>
            <div className="space-y-3">
              <QuickAction href="/expedientes/nueva" icon={<PlusCircle size={19} />} title="Nueva OT" description="Crear expediente de trabajo" />
              <QuickAction href="/clientes" icon={<Users size={19} />} title="Nuevo cliente" description="Alta rápida de cliente" />
              <QuickAction href="/vehiculos" icon={<Car size={19} />} title="Nuevo vehículo" description="Asociar vehículo a cliente" />
              <QuickAction href="/file-service" icon={<UploadCloud size={19} />} title="File Service" description="Nueva solicitud de archivo" />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xl font-bold mb-4">Actividad de OT</h2>
            <div className="h-40 flex items-end gap-2">
              {overview.actividad.map((h, i) => <div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-[#8a4a1f] to-[#e2954d]/80 transition-all" style={{ height: `${h}%` }} />)}
            </div>
            <p className="text-xs text-zinc-500 mt-3">Últimos 12 días según expedientes creados.</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-xl font-bold mb-4">Últimos clientes</h2>
          <div className="space-y-3">
            {overview.ultimosClientes.map((c: any) => (
              <a href={`/clientes/${c.id}`} key={c.id} className="flex items-center justify-between border border-white/10 rounded-2xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div>
                  <p className="font-bold">{c.nombre}</p>
                  <p className="text-sm text-zinc-500">{c.telefono || c.email || 'Sin contacto'}</p>
                </div>
                <span className="badge bg-zinc-800 border border-zinc-700 text-zinc-300">Cliente</span>
              </a>
            ))}
            {!loading && overview.ultimosClientes.length === 0 && <p className="text-zinc-500">Todavía no hay clientes.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-bold mb-4">File Service activo</h2>
          <div className="space-y-3">
            {overview.fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).slice(0, 5).map((f: any) => (
              <a href="/file-service" key={f.id} className="block border border-white/10 rounded-2xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{f.taller || f.matricula || 'Solicitud'}</p>
                    <p className="text-sm text-zinc-500">{[f.servicio, f.ecu, f.estado].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="text-zinc-300 font-bold">{money(f.precio)}</span>
                </div>
              </a>
            ))}
            {!loading && overview.fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).length === 0 && <p className="text-zinc-500">No hay archivos activos.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-bold mb-4">Avisos de stock bajo</h2>
          <div className="space-y-3">
            {overview.stockBajo.map((s: any) => (
              <a href="/stock" key={s.id} className="flex items-center justify-between border border-[#8a4a1f]/40 rounded-2xl p-4 bg-[#8a4a1f]/10 hover:bg-[#8a4a1f]/20 transition">
                <div>
                  <p className="font-bold">{s.referencia || s.descripcion}</p>
                  <p className="text-sm text-zinc-500">{s.tipo} · {s.ubicacion || 'Sin ubicación'}</p>
                </div>
                <span className="text-[#ffb870] font-bold">{s.cantidad}</span>
              </a>
            ))}
            {!loading && overview.stockBajo.length === 0 && <p className="text-zinc-500">Stock correcto.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
