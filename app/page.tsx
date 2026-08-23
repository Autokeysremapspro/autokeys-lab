'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Wallet,
  FileText,
  Car,
  Ticket,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge, LabDonut } from '@/components/lab'
import { getDashboardOverview, type DashboardOverview } from '@/lib/services/dashboard'
import { money } from '@/lib/status'

const emptyOverview: DashboardOverview = {
  stats: {
    otAbiertas: 0,
    terminadasHoy: 0,
    urgentes: 0,
    pendientesCobro: 0,
    clientes: 0,
    vehiculos: 0,
    fileServiceActivos: 0,
    fileServiceTotal: 0,
    stockBajo: 0,
    facturacionHoy: 0,
    facturacionMes: 0,
  },
  ultimosExpedientes: [],
  ultimosClientes: [],
  stockBajo: [],
  stockDestacado: [],
  fileService: [],
  actividad: [],
  tipoTrabajo: [],
  agendaHoy: [],
  fichaCliente: null,
  fichaVehiculo: null,
}

const donutPalette = ['#ff3b46', '#f5820a', '#2f7bf6', '#17b06b', '#8b5cf6', '#6b7280']

function weekDays() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const dayLabels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)
  const [ficha, setFicha] = useState<'cliente' | 'vehiculo'>('cliente')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getDashboardOverview()
      setOverview(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const { stats } = overview
  const today = new Date()
  const days = weekDays()
  const monthLabel = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const tipoTotal = overview.tipoTrabajo.reduce((a, t) => a + t.value, 0)

  return (
    <LabShell title="Dashboard">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <LabStatCard icon={<Briefcase size={19} />} tone="red" label="Trabajos activos" value={stats.otAbiertas} trend={12} subtitle="vs. semana anterior" />
          <LabStatCard icon={<Wallet size={19} />} tone="orange" label="Facturación mensual" value={money(stats.facturacionMes)} trend={18} subtitle="vs. mes anterior" />
          <LabStatCard icon={<FileText size={19} />} tone="blue" label="Archivos procesados" value={stats.fileServiceTotal.toLocaleString('es-ES')} trend={22} subtitle="vs. semana anterior" />
          <LabStatCard icon={<Car size={19} />} tone="green" label="Vehículos atendidos" value={stats.vehiculos} trend={9} subtitle="vs. semana anterior" />
          <LabStatCard icon={<Ticket size={19} />} tone="purple" label="Pedidos AK Cloud activos" value={stats.fileServiceActivos} trend={13} subtitle="vs. mes anterior" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_0.85fr]">
          <LabPanel
            title="Órdenes de trabajo recientes"
            action={<Link href="/ordenes-trabajo" className="text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver todas →</Link>}
            padded={false}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">ID</th>
                    <th className="px-3 py-3 font-bold">Cliente</th>
                    <th className="px-3 py-3 font-bold">Vehículo</th>
                    <th className="px-3 py-3 font-bold">Trabajo / Motivo</th>
                    <th className="px-3 py-3 font-bold">Técnico</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.ultimosExpedientes.map((o: any) => (
                    <tr key={o.id} className="border-t border-white/[0.06] hover:bg-white/[0.02]">
                      <td className="px-5 py-3"><Link href={`/expedientes/${o.id}`} className="font-bold text-white hover:text-[#ff5468]">{o.numero_ot || o.id.slice(0, 8)}</Link></td>
                      <td className="px-3 py-3 text-zinc-300">{o.cliente?.nombre || '—'}</td>
                      <td className="px-3 py-3 text-zinc-400">{`${o.vehiculo?.marca || ''} ${o.vehiculo?.modelo || ''}`.trim() || o.vehiculo?.matricula || '—'}</td>
                      <td className="px-3 py-3 text-zinc-400">{o.tipo_trabajo}</td>
                      <td className="px-3 py-3"><LabBadge status={o.estado}>{o.estado || 'recibido'}</LabBadge></td>
                    </tr>
                  ))}
                  {!loading && overview.ultimosExpedientes.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-600">Todavía no hay expedientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </LabPanel>

          <LabPanel title="Agenda de citas" action={<span className="text-xs font-bold text-zinc-500">Hoy</span>}>
            <div className="mb-3 flex items-center justify-between">
              <button className="rounded-lg p-1 text-zinc-600 hover:bg-white/5"><ChevronLeft size={16} /></button>
              <span className="text-sm font-bold capitalize text-zinc-300">{monthLabel}</span>
              <button className="rounded-lg p-1 text-zinc-600 hover:bg-white/5"><ChevronRight size={16} /></button>
            </div>
            <div className="mb-3 grid grid-cols-7 gap-1 text-center">
              {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString()
                return (
                  <div key={i} className={`rounded-xl py-2 text-[11px] font-bold ${isToday ? 'bg-[#c81f2a] text-white' : 'text-zinc-500'}`}>
                    <div className="text-[9px] uppercase tracking-wide opacity-80">{dayLabels[i]}</div>
                    <div className="mt-0.5 text-sm">{d.getDate()}</div>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2">
              {overview.agendaHoy.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin citas para hoy.</div>}
              {overview.agendaHoy.map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
                  <div className="w-11 shrink-0 font-mono font-bold text-zinc-400">
                    {new Date(ev.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-white">{ev.titulo}</div>
                    <div className="truncate text-zinc-500">
                      {[ev.vehiculo ? `${ev.vehiculo.marca || ''} ${ev.vehiculo.modelo || ''}`.trim() : null, ev.cliente?.nombre].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </LabPanel>

          <LabPanel title="Ficha rápida">
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
              <button onClick={() => setFicha('cliente')} className={`rounded-lg py-2 text-xs font-bold transition ${ficha === 'cliente' ? 'bg-[#c81f2a] text-white' : 'text-zinc-400 hover:text-white'}`}>Cliente</button>
              <button onClick={() => setFicha('vehiculo')} className={`rounded-lg py-2 text-xs font-bold transition ${ficha === 'vehiculo' ? 'bg-[#c81f2a] text-white' : 'text-zinc-400 hover:text-white'}`}>Vehículo</button>
            </div>

            {ficha === 'cliente' ? (
              overview.fichaCliente ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c81f2a]/15 text-sm font-bold text-[#ff5468]">
                      {overview.fichaCliente.nombre?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{overview.fichaCliente.nombre}</div>
                      <div className="truncate text-xs text-zinc-500">Cliente desde {new Date(overview.fichaCliente.created_at).toLocaleDateString('es-ES')}</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-zinc-400">
                    {overview.fichaCliente.telefono && <div className="flex items-center gap-2"><Phone size={13} /> {overview.fichaCliente.telefono}</div>}
                    {overview.fichaCliente.email && <div className="flex items-center gap-2"><Mail size={13} /> {overview.fichaCliente.email}</div>}
                    {overview.fichaCliente.poblacion && <div className="flex items-center gap-2"><MapPin size={13} /> {overview.fichaCliente.poblacion}</div>}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                    <div><div className="text-lg font-bold text-white">{overview.fichaCliente.vehiculosCount}</div><div className="text-[10px] text-zinc-600">Vehículos</div></div>
                    <div><div className="text-lg font-bold text-white">{overview.fichaCliente.ordenesCount}</div><div className="text-[10px] text-zinc-600">Órdenes</div></div>
                    <div><div className="text-sm font-bold text-white">{money(overview.fichaCliente.gastoTotal)}</div><div className="text-[10px] text-zinc-600">Gasto total</div></div>
                  </div>
                  <Link href={`/clientes/${overview.fichaCliente.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]">
                    Ver ficha completa <ArrowRight size={13} />
                  </Link>
                </div>
              ) : <div className="py-8 text-center text-xs text-zinc-600">Sin clientes todavía.</div>
            ) : (
              overview.fichaVehiculo ? (
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-600">{overview.fichaVehiculo.matricula || '—'}</div>
                  <div className="text-lg font-bold text-white">{overview.fichaVehiculo.marca} {overview.fichaVehiculo.modelo}</div>
                  <div className="mt-4 space-y-2 text-xs text-zinc-400">
                    <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Cliente</span><span className="font-semibold text-zinc-300">{overview.fichaVehiculo.cliente?.nombre || '—'}</span></div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Motor</span><span className="font-semibold text-zinc-300">{overview.fichaVehiculo.motor || '—'}</span></div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Año</span><span className="font-semibold text-zinc-300">{overview.fichaVehiculo.anio || '—'}</span></div>
                    <div className="flex justify-between pb-2"><span className="text-zinc-600">Bastidor</span><span className="font-mono text-[11px] font-semibold text-zinc-300">{overview.fichaVehiculo.bastidor || '—'}</span></div>
                  </div>
                  <Link href={`/vehiculos/${overview.fichaVehiculo.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]">
                    Ver historial del vehículo <ArrowRight size={13} />
                  </Link>
                </div>
              ) : <div className="py-8 text-center text-xs text-zinc-600">Sin vehículos todavía.</div>
            )}
          </LabPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <LabPanel title="Stock" action={<Link href="/stock" className="text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver stock completo</Link>}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Artículos destacados</div>
            <div className="space-y-2">
              {overview.stockDestacado.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-white">{s.descripcion}</div>
                    <div className="truncate text-[11px] text-zinc-600">{s.referencia || s.tipo}</div>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-zinc-300">Stock: {s.cantidad ?? 0}</div>
                </div>
              ))}
              {overview.stockDestacado.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin artículos en stock.</div>}
            </div>
          </LabPanel>

          <LabPanel title="AK Cloud" action={<Link href="/ak-cloud" className="flex items-center gap-1.5 text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]"><UploadCloud size={13} /> Ver pedidos</Link>}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Actividad reciente</div>
            <div className="space-y-2">
              {overview.fileService.slice(0, 5).map((f: any) => (
                <div key={f.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-xs font-bold text-white">{[f.marca, f.modelo, f.servicio].filter(Boolean).join('_') || f.servicio}</div>
                    <LabBadge status={f.estado}>{f.estado || 'pendiente'}</LabBadge>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">{f.taller || f.matricula || '—'}</div>
                </div>
              ))}
              {overview.fileService.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin actividad reciente.</div>}
            </div>
          </LabPanel>

          <LabPanel title="Estadísticas" action={<span className="text-xs font-bold text-zinc-500">Este mes</span>}>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <LabDonut
                size={140}
                thickness={18}
                centerValue={String(tipoTotal)}
                centerLabel="Total"
                segments={overview.tipoTrabajo.map((t, i) => ({ label: t.label, value: t.value, color: donutPalette[i % donutPalette.length] }))}
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                {overview.tipoTrabajo.map((t, i) => (
                  <div key={t.label} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: donutPalette[i % donutPalette.length] }} />
                    <span className="truncate text-zinc-400">{t.label}</span>
                    <span className="ml-auto font-bold text-zinc-300">{tipoTotal ? Math.round((t.value / tipoTotal) * 100) : 0}%</span>
                  </div>
                ))}
                {overview.tipoTrabajo.length === 0 && <div className="text-xs text-zinc-600">Sin datos todavía.</div>}
              </div>
            </div>
          </LabPanel>

          <LabPanel title={overview.fichaVehiculo ? `${overview.fichaVehiculo.marca || ''} ${overview.fichaVehiculo.modelo || ''}`.trim() : 'Vehículo'}>
            {overview.fichaVehiculo ? (
              <div>
                <div className="grid h-24 place-items-center rounded-xl bg-white/[0.03] text-zinc-700">
                  <Car size={44} strokeWidth={1.2} />
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Matrícula</span><span className="font-bold text-zinc-200">{overview.fichaVehiculo.matricula || '—'}</span></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Bastidor</span><span className="font-mono text-[11px] font-bold text-zinc-200">{overview.fichaVehiculo.bastidor || '—'}</span></div>
                  <div className="flex justify-between pb-1"><span className="text-zinc-600">Año</span><span className="font-bold text-zinc-200">{overview.fichaVehiculo.anio || '—'}</span></div>
                </div>
                <Link href={`/vehiculos/${overview.fichaVehiculo.id}`} className="mt-4 block rounded-xl bg-[#c81f2a] py-2.5 text-center text-xs font-bold text-white hover:bg-[#e2242f]">
                  Ver historial del vehículo
                </Link>
              </div>
            ) : <div className="py-8 text-center text-xs text-zinc-600">Sin vehículos todavía.</div>}
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}
