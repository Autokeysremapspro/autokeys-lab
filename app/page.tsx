'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase, Wallet, FileText, Car, Ticket, ChevronLeft, ChevronRight, UploadCloud,
  ArrowRight, Mail, Phone, MapPin, Archive, Cpu,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge, LabDonut } from '@/components/lab'
import { getDashboardOverview, type DashboardOverview } from '@/lib/services/dashboard'
import { money } from '@/lib/status'

const emptyOverview: DashboardOverview = {
  stats: { otAbiertas: 0, terminadasHoy: 0, urgentes: 0, pendientesCobro: 0, clientes: 0, vehiculos: 0, fileServiceActivos: 0, fileServiceTotal: 0, stockBajo: 0, facturacionHoy: 0, facturacionMes: 0 },
  ultimosExpedientes: [], ultimosClientes: [], stockBajo: [], stockDestacado: [], fileService: [], actividad: [], tipoTrabajo: [], agendaHoy: [], fichaCliente: null, fichaVehiculo: null,
}

const donutPalette = ['#ef202d', '#f59e0b', '#2f7bf6', '#8b5cf6', '#17b06b', '#38bdf8']
const fallbackSpark = [18,22,20,27,24,29,25,31,28,34,32,38]

function weekDays() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

const dayLabels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function progressForState(state?: string | null) {
  const s = String(state || '').toLowerCase()
  if (['finalizado', 'entregado', 'completado'].includes(s)) return 100
  if (['en proceso', 'en_proceso'].includes(s)) return 70
  if (['analizando', 'procesando'].includes(s)) return 45
  return 18
}

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [ficha, setFicha] = useState<'cliente' | 'vehiculo'>('cliente')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    try { setOverview(await getDashboardOverview()) } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const { stats } = overview
  const today = new Date()
  const days = weekDays()
  const monthLabel = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const tipoTotal = overview.tipoTrabajo.reduce((a, t) => a + t.value, 0)
  const spark = overview.actividad.length > 1 ? overview.actividad : fallbackSpark

  return (
    <LabShell>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <LabStatCard icon={<Briefcase size={18}/>} tone="red" label="Trabajos activos" value={stats.otAbiertas} trend={12} subtitle="vs. semana anterior" sparkline={spark} />
          <LabStatCard icon={<Wallet size={18}/>} tone="orange" label="Facturación mensual" value={money(stats.facturacionMes)} trend={18} subtitle="vs. mes anterior" sparkline={spark.map((n,i)=>n + (i%3)*5)} />
          <LabStatCard icon={<FileText size={18}/>} tone="blue" label="Archivos procesados" value={stats.fileServiceTotal.toLocaleString('es-ES')} trend={22} subtitle="vs. semana anterior" sparkline={spark.map((n,i)=>n + (i%2)*8)} />
          <LabStatCard icon={<Car size={18}/>} tone="green" label="Vehículos atendidos" value={stats.vehiculos} trend={9} subtitle="vs. mes anterior" sparkline={spark.map((n,i)=>n + (i%4)*3)} />
          <LabStatCard icon={<Ticket size={18}/>} tone="purple" label="Tickets abiertos" value={stats.fileServiceActivos} trend={13} subtitle="vs. mes anterior" sparkline={spark.map((n,i)=>n - (i%3)*2)} />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.45fr_1fr_.76fr]">
          <LabPanel title="Órdenes de trabajo recientes" action={<Link href="/ordenes-trabajo" className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[9px] text-zinc-300 hover:bg-white/[0.04]">Ver todas</Link>} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead><tr className="text-left text-[8px] uppercase tracking-[.08em] text-zinc-600"><th className="px-4 py-3">ID</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Vehículo</th><th className="px-3 py-3">Trabajo / Motivo</th><th className="px-3 py-3">Técnico</th><th className="px-3 py-3" /></tr></thead>
                <tbody>
                  {overview.ultimosExpedientes.slice(0,6).map((o:any)=><tr key={o.id} className="border-t border-white/[0.055] hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-medium text-zinc-300"><Link href={`/expedientes/${o.id}`}>{o.numero_ot || o.id.slice(0,8)}</Link></td>
                    <td className="px-3 py-2.5 text-zinc-300">{o.cliente?.nombre || '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{`${o.vehiculo?.marca || ''} ${o.vehiculo?.modelo || ''}`.trim() || o.vehiculo?.matricula || '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{o.tipo_trabajo || '—'}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{o.tecnico || '—'}</td>
                    <td className="px-3 py-2.5"><LabBadge status={o.estado}>{o.estado || 'recibido'}</LabBadge></td>
                  </tr>)}
                  {!loading && overview.ultimosExpedientes.length===0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-600">Todavía no hay órdenes.</td></tr>}
                </tbody>
              </table>
            </div>
          </LabPanel>

          <LabPanel title="Agenda de citas" action={<button className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[9px] text-zinc-300">Hoy⌄</button>}>
            <div className="mb-2 flex items-center justify-center gap-8"><button className="text-zinc-600"><ChevronLeft size={14}/></button><span className="text-[10px] font-medium capitalize text-zinc-300">{monthLabel}</span><button className="text-zinc-600"><ChevronRight size={14}/></button></div>
            <div className="mb-3 grid grid-cols-7 gap-1 text-center">{days.map((d,i)=>{const isToday=d.toDateString()===today.toDateString();return <div key={i} className={`rounded-md py-1.5 ${isToday?'border border-[#e42b35] bg-[#8f171f] text-white':'text-zinc-500'}`}><div className="text-[7px] font-medium">{dayLabels[i]}</div><div className="mt-0.5 text-[13px] font-semibold">{d.getDate()}</div></div>})}</div>
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
              {overview.agendaHoy.slice(0,5).map((ev:any)=><div key={ev.id} className="grid grid-cols-[48px_1fr_auto] gap-2 border-b border-white/[0.055] px-3 py-2 text-[9px] last:border-b-0"><span className="font-mono text-zinc-300">{new Date(ev.fecha_inicio).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span><span className="truncate text-zinc-300">{ev.titulo}</span><span className="max-w-[110px] truncate text-zinc-500">{ev.cliente?.nombre || ev.vehiculo?.matricula || ''}</span></div>)}
              {overview.agendaHoy.length===0 && <div className="px-3 py-8 text-center text-[9px] text-zinc-600">Sin citas para hoy.</div>}
            </div>
          </LabPanel>

          <LabPanel title="Ficha rápida">
            <div className="mb-4 grid grid-cols-2 rounded-md border border-white/[0.065] bg-[#0a0c10] p-0.5"><button onClick={()=>setFicha('cliente')} className={`rounded py-2 text-[9px] font-medium ${ficha==='cliente'?'border border-[#ef202d] bg-[#6d1318] text-white':'text-zinc-500'}`}>Cliente</button><button onClick={()=>setFicha('vehiculo')} className={`rounded py-2 text-[9px] font-medium ${ficha==='vehiculo'?'border border-[#ef202d] bg-[#6d1318] text-white':'text-zinc-500'}`}>Vehículo</button></div>
            {ficha==='cliente' ? overview.fichaCliente ? <div>
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-700/60 text-[11px] font-semibold">{overview.fichaCliente.nombre?.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}</div><div><div className="text-[11px] font-medium text-zinc-200">{overview.fichaCliente.nombre}</div><div className="text-[8px] text-zinc-600">Cliente desde {new Date(overview.fichaCliente.created_at).toLocaleDateString('es-ES')}</div></div></div>
              <div className="mt-3 space-y-2 text-[9px] text-zinc-400">{overview.fichaCliente.telefono&&<div className="flex items-center gap-2"><Phone size={11}/>{overview.fichaCliente.telefono}</div>}{overview.fichaCliente.email&&<div className="flex items-center gap-2"><Mail size={11}/>{overview.fichaCliente.email}</div>}{overview.fichaCliente.poblacion&&<div className="flex items-center gap-2"><MapPin size={11}/>{overview.fichaCliente.poblacion}</div>}</div>
              <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.06] py-2 text-center"><div><div className="text-[11px] font-semibold">{overview.fichaCliente.ordenesCount}</div><div className="text-[7px] text-zinc-600">Órdenes</div></div><div><div className="text-[11px] font-semibold">{money(overview.fichaCliente.gastoTotal)}</div><div className="text-[7px] text-zinc-600">Gasto total</div></div><div><div className="text-[11px] font-semibold">{overview.fichaCliente.vehiculosCount}</div><div className="text-[7px] text-zinc-600">Vehículos</div></div></div>
              <Link href={`/clientes/${overview.fichaCliente.id}`} className="mt-3 flex items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-[9px] text-zinc-300">Ver ficha completa</Link>
            </div> : <div className="py-8 text-center text-[9px] text-zinc-600">Sin clientes todavía.</div> : overview.fichaVehiculo ? <div className="text-[10px] text-zinc-400"><div className="font-semibold text-white">{overview.fichaVehiculo.marca} {overview.fichaVehiculo.modelo}</div><div className="mt-3 space-y-2"><div>Matrícula: {overview.fichaVehiculo.matricula||'—'}</div><div>Motor: {overview.fichaVehiculo.motor||'—'}</div><div>Año: {overview.fichaVehiculo.anio||'—'}</div></div></div> : <div className="py-8 text-center text-[9px] text-zinc-600">Sin vehículos.</div>}
          </LabPanel>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_1.15fr_1.18fr_.82fr]">
          <LabPanel title={<span className="text-[13px] font-semibold text-white">Stock <span className="font-normal text-zinc-500">– Artículos destacados</span></span>} action={<Link href="/stock" className="rounded-md border border-white/[0.07] px-2.5 py-1.5 text-[8px] text-zinc-300">Ver stock completo</Link>}>
            <div className="space-y-1">{overview.stockDestacado.slice(0,5).map((s:any)=><div key={s.id} className="flex items-center gap-2.5 py-1.5"><div className="grid h-8 w-8 place-items-center rounded bg-white/[0.04] text-zinc-500"><Archive size={15}/></div><div className="min-w-0 flex-1"><div className="truncate text-[9px] font-medium text-zinc-300">{s.descripcion}</div><div className="truncate text-[7px] text-zinc-600">{s.referencia || s.tipo}</div></div><div className="text-[9px] text-zinc-300">Stock: {s.cantidad ?? 0} uds</div></div>)}{overview.stockDestacado.length===0&&<div className="py-6 text-center text-[9px] text-zinc-600">Sin artículos.</div>}</div>
          </LabPanel>

          <LabPanel title={<span className="text-[13px] font-semibold text-white">File Service <span className="font-normal text-zinc-500">– Actividad reciente</span></span>} action={<Link href="/file-service" className="flex items-center gap-1 rounded-md border border-white/[0.07] px-2.5 py-1.5 text-[8px] text-zinc-300"><UploadCloud size={10}/> Subir archivo</Link>}>
            <div className="space-y-2">{overview.fileService.slice(0,5).map((f:any)=>{const p=progressForState(f.estado);return <div key={f.id} className="flex items-center gap-2"><FileText size={14} className="text-zinc-500"/><div className="min-w-0 flex-1"><div className="truncate text-[9px] text-zinc-300">{f.matricula || f.taller || f.id}</div><div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full bg-gradient-to-r from-[#ef202d] to-[#57c85e]" style={{width:`${p}%`}}/></div></div><div className="w-9 text-right text-[8px] text-zinc-500">{p}%</div></div>})}{overview.fileService.length===0&&<div className="py-6 text-center text-[9px] text-zinc-600">Sin actividad reciente.</div>}</div>
          </LabPanel>

          <LabPanel title="Estadísticas" action={<button className="rounded-md border border-white/[0.07] px-2.5 py-1.5 text-[8px] text-zinc-400">Este mes⌄</button>}>
            <div className="flex items-center gap-4"><LabDonut size={136} thickness={18} centerValue={String(tipoTotal)} centerLabel="Total" segments={overview.tipoTrabajo.map((t,i)=>({label:t.label,value:t.value,color:donutPalette[i%donutPalette.length]}))}/><div className="min-w-0 flex-1 space-y-1.5">{overview.tipoTrabajo.slice(0,6).map((t,i)=><div key={t.label} className="flex items-center gap-2 text-[8px]"><span className="h-2 w-2 rounded-full" style={{background:donutPalette[i%donutPalette.length]}}/><span className="truncate text-zinc-400">{t.label}</span><span className="ml-auto text-zinc-300">{tipoTotal?Math.round(t.value/tipoTotal*100):0}% ({t.value})</span></div>)}</div></div>
          </LabPanel>

          <LabPanel title={overview.fichaVehiculo ? `${overview.fichaVehiculo.marca || ''} ${overview.fichaVehiculo.modelo || ''}`.trim() : 'Vehículo'}>
            {overview.fichaVehiculo ? <div><div className="relative grid h-28 place-items-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,.06),transparent_60%)]"><Car size={62} strokeWidth={1} className="text-zinc-500"/></div><div className="mt-3 grid grid-cols-[80px_1fr] gap-y-2 text-[8px]"><span className="text-zinc-600">Matrícula</span><span className="text-zinc-300">{overview.fichaVehiculo.matricula||'—'}</span><span className="text-zinc-600">VIN</span><span className="truncate font-mono text-zinc-300">{overview.fichaVehiculo.bastidor||'—'}</span><span className="text-zinc-600">Año</span><span className="text-zinc-300">{overview.fichaVehiculo.anio||'—'}</span><span className="text-zinc-600">Motor</span><span className="text-zinc-300">{overview.fichaVehiculo.motor||'—'}</span></div><Link href={`/vehiculos/${overview.fichaVehiculo.id}`} className="mt-3 flex items-center justify-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-[8px] text-zinc-300">Ver historial del vehículo <ArrowRight size={10}/></Link></div>:<div className="py-8 text-center text-[9px] text-zinc-600">Sin vehículos.</div>}
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}
