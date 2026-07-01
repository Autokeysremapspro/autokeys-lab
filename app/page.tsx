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
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 card p-5 border-red-900/30">
        <div>
          <p className="text-sm text-red-300 font-black uppercase tracking-[0.18em]">Autokeys Core v1.2</p>
          <h2 className="text-2xl font-black mt-1">Panel conectado a datos reales</h2>
          <p className="text-zinc-500 mt-1">Clientes, vehículos, OT, facturación, stock y File Service desde Supabase.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-dark flex items-center justify-center gap-2">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/20 p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="OT abiertas" value={stats.otAbiertas} subtitle="Trabajos activos" icon={<ClipboardList size={20} />} tone="red" />
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
              <h2 className="text-xl font-black">Últimos expedientes</h2>
              <p className="text-sm text-zinc-500">Actividad reciente del laboratorio</p>
            </div>
          </div>
          <DataTable columns={['OT', 'Cliente', 'Vehículo', 'Trabajo', 'Estado', 'Importe']} rows={overview.ultimosExpedientes.map((o: any) => [
            <a href={`/expedientes/${o.id}`} className="font-black hover:text-red-400">{o.numero_ot}</a>,
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
            <h2 className="text-xl font-black">Acciones rápidas</h2>
            <p className="text-sm text-zinc-500 mb-4">Crear trabajo, cliente o material</p>
            <div className="space-y-3">
              <QuickAction href="/expedientes/nueva" icon={<PlusCircle size={19} />} title="Nueva OT" description="Crear expediente de trabajo" />
              <QuickAction href="/clientes" icon={<Users size={19} />} title="Nuevo cliente" description="Alta rápida de cliente" />
              <QuickAction href="/vehiculos" icon={<Car size={19} />} title="Nuevo vehículo" description="Asociar vehículo a cliente" />
              <QuickAction href="/file-service" icon={<UploadCloud size={19} />} title="File Service" description="Nueva solicitud de archivo" />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xl font-black mb-4">Actividad de OT</h2>
            <div className="h-40 flex items-end gap-2">
              {overview.actividad.map((h, i) => <div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-red-900 to-red-500/80 transition-all" style={{ height: `${h}%` }} />)}
            </div>
            <p className="text-xs text-zinc-500 mt-3">Últimos 12 días según expedientes creados.</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-xl font-black mb-4">Últimos clientes</h2>
          <div className="space-y-3">
            {overview.ultimosClientes.map((c: any) => (
              <a href={`/clientes/${c.id}`} key={c.id} className="flex items-center justify-between border border-white/10 rounded-2xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div>
                  <p className="font-black">{c.nombre}</p>
                  <p className="text-sm text-zinc-500">{c.telefono || c.email || 'Sin contacto'}</p>
                </div>
                <span className="badge bg-zinc-800 border border-zinc-700 text-zinc-300">Cliente</span>
              </a>
            ))}
            {!loading && overview.ultimosClientes.length === 0 && <p className="text-zinc-500">Todavía no hay clientes.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black mb-4">File Service activo</h2>
          <div className="space-y-3">
            {overview.fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).slice(0, 5).map((f: any) => (
              <a href="/file-service" key={f.id} className="block border border-white/10 rounded-2xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{f.taller || f.matricula || 'Solicitud'}</p>
                    <p className="text-sm text-zinc-500">{[f.servicio, f.ecu, f.estado].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="text-zinc-300 font-black">{money(f.precio)}</span>
                </div>
              </a>
            ))}
            {!loading && overview.fileService.filter((f: any) => !['finalizado', 'cancelado'].includes(String(f.estado))).length === 0 && <p className="text-zinc-500">No hay archivos activos.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black mb-4">Avisos de stock bajo</h2>
          <div className="space-y-3">
            {overview.stockBajo.map((s: any) => (
              <a href="/stock" key={s.id} className="flex items-center justify-between border border-red-900/40 rounded-2xl p-4 bg-red-950/10 hover:bg-red-950/20 transition">
                <div>
                  <p className="font-black">{s.referencia || s.descripcion}</p>
                  <p className="text-sm text-zinc-500">{s.tipo} · {s.ubicacion || 'Sin ubicación'}</p>
                </div>
                <span className="text-red-300 font-black">{s.cantidad}</span>
              </a>
            ))}
            {!loading && overview.stockBajo.length === 0 && <p className="text-zinc-500">Stock correcto.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
