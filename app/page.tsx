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
      <div className="ak-v5-reveal space-y-6">
        <section className="ak-v5-glass relative overflow-hidden rounded-[32px] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-[#e5a05d]/10 blur-[90px]"/>
          <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div><div className="ak-v5-pill"><span className="ak-v5-dot"/> Laboratorio operativo</div><div className="ak-v5-kicker mt-7">Mission Control · Autokeys Core</div><h1 className="ak-v5-title mt-3 text-5xl sm:text-6xl">Buenos días, Carlos.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/38">Todo el laboratorio en una sola vista: trabajos, facturación, stock y actividad de AK Cloud.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row"><a href="/expedientes/nueva" className="ak-v5-button"><PlusCircle size={18}/> Nueva orden</a><button onClick={load} disabled={loading} className="ak-v5-button-secondary"><RefreshCw size={17} className={loading?'animate-spin':''}/> Sincronizar</button></div>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5"><div className="ak-v5-stat"><div className="text-[10px] uppercase tracking-widest text-white/28">OT abiertas</div><div className="ak-v5-stat-value mt-2">{stats.otAbiertas}</div></div><div className="ak-v5-stat"><div className="text-[10px] uppercase tracking-widest text-white/28">Urgentes</div><div className="ak-v5-stat-value mt-2 text-[#ff6b7f]">{stats.urgentes}</div></div><div className="ak-v5-stat"><div className="text-[10px] uppercase tracking-widest text-white/28">Terminadas hoy</div><div className="ak-v5-stat-value mt-2 text-[#53e6a8]">{stats.terminadasHoy}</div></div><div className="ak-v5-stat"><div className="text-[10px] uppercase tracking-widest text-white/28">File Service</div><div className="ak-v5-stat-value mt-2 text-[#67e8d1]">{stats.fileServiceActivos}</div></div><div className="ak-v5-stat col-span-2 lg:col-span-1"><div className="text-[10px] uppercase tracking-widest text-white/28">Facturación hoy</div><div className="ak-v5-stat-value mt-2 text-[#ffd09a]">{money(stats.facturacionHoy)}</div></div></div>
        </section>
        {error&&<div className="rounded-2xl border border-[#ff4964]/25 bg-[#ff4964]/10 p-4 text-[#ff8b9c]">{error}</div>}
        <div className="grid gap-6 2xl:grid-cols-[1.55fr_.75fr]">
          <section className="ak-v5-card p-5 sm:p-6"><div className="mb-5 flex items-end justify-between"><div><div className="ak-v5-kicker">Cola de trabajo</div><h2 className="mt-2 text-2xl font-bold">Últimos expedientes</h2></div><a href="/expedientes" className="text-xs font-bold text-[#e5a05d]">Ver todos →</a></div><DataTable columns={['OT','Cliente','Vehículo','Trabajo','Estado','Importe']} rows={overview.ultimosExpedientes.map((o:any)=>[<a href={`/expedientes/${o.id}`} className="font-bold text-[#ffd09a]">{o.numero_ot}</a>,o.cliente?.nombre||'-',`${o.vehiculo?.marca||''} ${o.vehiculo?.modelo||''} ${o.vehiculo?.matricula||''}`.trim()||'-',o.tipo_trabajo,<span className={`badge ${statusClass(o.estado)}`}>{o.estado||'recibido'}</span>,money(o.precio_final||o.precio_estimado)])}/>{!loading&&overview.ultimosExpedientes.length===0&&<p className="py-8 text-center text-white/30">Todavía no hay expedientes.</p>}</section>
          <aside className="space-y-6"><section className="ak-v5-card p-5"><div className="ak-v5-kicker">Acciones rápidas</div><div className="mt-4 space-y-2"><QuickAction href="/expedientes/nueva" icon={<PlusCircle size={19}/>} title="Nueva OT" description="Crear expediente"/><QuickAction href="/clientes" icon={<Users size={19}/>} title="Nuevo cliente" description="Alta rápida"/><QuickAction href="/vehiculos" icon={<Car size={19}/>} title="Nuevo vehículo" description="Vincular a cliente"/><QuickAction href="/ak-cloud/produccion" icon={<UploadCloud size={19}/>} title="Producción AK Cloud" description="Gestionar pedidos"/></div></section><section className="ak-v5-card p-5"><div className="flex items-center justify-between"><div><div className="ak-v5-kicker">Actividad</div><h3 className="mt-2 font-bold">Últimos 12 días</h3></div><span className="ak-v5-pill"><span className="ak-v5-dot"/> Live</span></div><div className="mt-7 flex h-32 items-end gap-2">{overview.actividad.map((h,i)=><div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#9b5628] to-[#ffd09a] opacity-80" style={{height:`${Math.max(8,h)}%`}}/>)}</div></section></aside>
        </div>
        <div className="grid gap-6 xl:grid-cols-3"><section className="ak-v5-card p-5"><div className="ak-v5-kicker">Clientes recientes</div><div className="mt-4 space-y-2">{overview.ultimosClientes.slice(0,5).map((c:any)=><a href={`/clientes/${c.id}`} key={c.id} className="flex items-center justify-between rounded-2xl border border-white/[.07] bg-white/[.025] p-4 hover:bg-white/[.045]"><div><div className="font-bold">{c.nombre}</div><div className="mt-1 text-xs text-white/30">{c.telefono||c.email||'Sin contacto'}</div></div><span className="text-xs text-white/25">Abrir →</span></a>)}</div></section><section className="ak-v5-card p-5"><div className="ak-v5-kicker">AK Cloud activo</div><div className="mt-4 space-y-2">{overview.fileService.filter((f:any)=>!['finalizado','cancelado'].includes(String(f.estado))).slice(0,5).map((f:any)=><a href="/ak-cloud/produccion" key={f.id} className="block rounded-2xl border border-white/[.07] bg-white/[.025] p-4 hover:bg-white/[.045]"><div className="flex justify-between gap-3"><div><div className="font-bold">{f.taller||f.matricula||'Solicitud'}</div><div className="mt-1 text-xs text-white/30">{[f.servicio,f.ecu,f.estado].filter(Boolean).join(' · ')}</div></div><div className="font-bold text-[#ffd09a]">{money(f.precio)}</div></div></a>)}</div></section><section className="ak-v5-card p-5"><div className="ak-v5-kicker">Stock crítico</div><div className="mt-4 space-y-2">{overview.stockBajo.slice(0,5).map((x:any)=><a href="/stock" key={x.id} className="flex items-center justify-between rounded-2xl border border-[#ff4964]/15 bg-[#ff4964]/[.045] p-4"><div><div className="font-bold">{x.referencia||x.descripcion}</div><div className="mt-1 text-xs text-white/30">{x.tipo} · {x.ubicacion||'Sin ubicación'}</div></div><span className="font-black text-[#ff8b9c]">{x.cantidad}</span></a>)}</div></section></div>
      </div>
    </AppShell>
  )
}
