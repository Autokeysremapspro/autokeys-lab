'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import CustomSelect from '@/components/ak/CustomSelect'
import { supabase } from '@/lib/supabase'
import {
  AkCloudProduccionPedido,
  ProduccionEstado,
  actualizarEstadoProduccion,
  asignarTecnicoProduccion,
  estadoClass,
  estadoLabel,
  getPedidosProduccion,
  minutosDesde,
  normalizarEstado,
  serviciosTexto,
  tiempoHumano,
  tituloPedido,
} from '@/lib/services/akCloudProduccion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudCog,
  Factory,
  Filter,
  RefreshCw,
  Search,
  Timer,
  UserCog,
  FileCode2,
  Gauge,
  Inbox,
  SlidersHorizontal,
  X,
} from 'lucide-react'

const tecnicos = ['Carlos', 'Ana', 'Laboratorio', 'Administración']
const estados: { value: ProduccionEstado; label: string }[] = [
  { value: 'pendiente', label: 'Nuevo' },
  { value: 'analizando', label: 'Analizando' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'calidad', label: 'Control calidad' },
  { value: 'finalizado', label: 'Finalizado' },
]

type FiltroRapido = 'todos' | 'nuevos' | 'sin_tecnico' | 'trabajando' | 'calidad' | 'urgentes' | 'finalizados'

export default function ProduccionAkCloudPage() {
  const [pedidos, setPedidos] = useState<AkCloudProduccionPedido[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroRapido>('todos')
  const [tecnicoFiltro, setTecnicoFiltro] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load(silent = false) {
    if (!silent) setLoading(true)
    try {
      const rows = await getPedidosProduccion()
      setPedidos(rows)
      setSelectedId((current) => current && rows.some((p) => p.id === current) ? current : rows[0]?.id || null)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar producción')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('akcore-produccion-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'file_service_pedidos' }, () => load(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const stats = useMemo(() => ({
    total: pedidos.length,
    nuevos: pedidos.filter((p) => normalizarEstado(p.estado) === 'pendiente').length,
    sinTecnico: pedidos.filter((p) => !p.tecnico_asignado && normalizarEstado(p.estado) !== 'finalizado').length,
    trabajando: pedidos.filter((p) => ['analizando', 'en_proceso'].includes(normalizarEstado(p.estado))).length,
    calidad: pedidos.filter((p) => normalizarEstado(p.estado) === 'calidad').length,
    urgentes: pedidos.filter((p) => p.urgente || p.prioridad === 'urgente').length,
    finalizados: pedidos.filter((p) => normalizarEstado(p.estado) === 'finalizado').length,
  }), [pedidos])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = pedidos.filter((pedido) => {
      const estado = normalizarEstado(pedido.estado)
      const urgente = pedido.urgente || pedido.prioridad === 'urgente'
      if (filtro === 'nuevos' && estado !== 'pendiente') return false
      if (filtro === 'sin_tecnico' && (pedido.tecnico_asignado || estado === 'finalizado')) return false
      if (filtro === 'trabajando' && !['analizando', 'en_proceso'].includes(estado)) return false
      if (filtro === 'calidad' && estado !== 'calidad') return false
      if (filtro === 'urgentes' && !urgente) return false
      if (filtro === 'finalizados' && estado !== 'finalizado') return false
      if (tecnicoFiltro && pedido.tecnico_asignado !== tecnicoFiltro) return false
      const texto = [pedido.numero, pedido.cliente_nombre, pedido.cliente_email, pedido.marca, pedido.modelo, pedido.motor, pedido.ecu, pedido.hw, pedido.sw, ...(pedido.servicios || [])]
        .filter(Boolean).join(' ').toLowerCase()
      return !q || texto.includes(q)
    })

    return rows.sort((a, b) => {
      const au = a.urgente || a.prioridad === 'urgente' ? 1 : 0
      const bu = b.urgente || b.prioridad === 'urgente' ? 1 : 0
      if (au !== bu) return bu - au
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    })
  }, [pedidos, query, filtro, tecnicoFiltro])

  const selected = useMemo(() => pedidos.find((p) => p.id === selectedId) || filtrados[0] || null, [pedidos, filtrados, selectedId])

  async function moverPedido(id: string, estado: ProduccionEstado) {
    setWorking(id)
    try {
      await actualizarEstadoProduccion(id, estado)
      setPedidos((rows) => rows.map((p) => p.id === id ? { ...p, estado, updated_at: new Date().toISOString() } : p))
      toast.success(`Estado: ${estadoLabel(estado)}`)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cambiar el estado')
    } finally { setWorking(null) }
  }

  async function asignar(id: string, tecnico: string) {
    setWorking(id)
    try {
      await asignarTecnicoProduccion(id, tecnico)
      setPedidos((rows) => rows.map((p) => p.id === id ? { ...p, tecnico_asignado: tecnico || null } : p))
      toast.success(tecnico ? `Asignado a ${tecnico}` : 'Pedido sin técnico')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo asignar técnico')
    } finally { setWorking(null) }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#080b10] via-[#101827] to-[#21040b] p-7 shadow-2xl shadow-black/40">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#e2954d]/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e2954d]/25 bg-[#e2954d]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb870]">
                <Factory size={16} /> Mesa de producción
              </div>
              <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">Producción AK Cloud</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">Una sola mesa de trabajo para recibir, priorizar, asignar, revisar y entregar archivos sin navegar por fases.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ak-cloud" className="btn btn-dark inline-flex items-center gap-2"><CloudCog size={17} /> Centro AK Cloud</Link>
              <button onClick={() => load()} className="btn btn-red inline-flex items-center gap-2"><RefreshCw size={17} /> Actualizar</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
          <QuickFilter active={filtro === 'todos'} onClick={() => setFiltro('todos')} label="Activos" value={stats.total} icon={Inbox} />
          <QuickFilter active={filtro === 'nuevos'} onClick={() => setFiltro('nuevos')} label="Nuevos" value={stats.nuevos} icon={AlertTriangle} />
          <QuickFilter active={filtro === 'sin_tecnico'} onClick={() => setFiltro('sin_tecnico')} label="Sin asignar" value={stats.sinTecnico} icon={UserCog} />
          <QuickFilter active={filtro === 'trabajando'} onClick={() => setFiltro('trabajando')} label="Trabajando" value={stats.trabajando} icon={Gauge} />
          <QuickFilter active={filtro === 'calidad'} onClick={() => setFiltro('calidad')} label="Revisión" value={stats.calidad} icon={Timer} />
          <QuickFilter active={filtro === 'urgentes'} onClick={() => setFiltro('urgentes')} label="Urgentes" value={stats.urgentes} icon={AlertTriangle} danger />
          <QuickFilter active={filtro === 'finalizados'} onClick={() => setFiltro('finalizados')} label="Finalizados" value={stats.finalizados} icon={CheckCircle2} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <Search size={17} className="text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pedido, distribuidor, vehículo, ECU, HW, SW o servicio…" className="w-full bg-transparent outline-none" />
              {query && <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white"><X size={16} /></button>}
            </div>
            <div className="min-w-[220px] rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <CustomSelect value={tecnicoFiltro} onChange={setTecnicoFiltro} placeholder="Todos los técnicos" options={[{ value: '', label: 'Todos los técnicos' }, ...tecnicos.map((t) => ({ value: t, label: t }))]} />
            </div>
            <div className="inline-flex items-center gap-2 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500"><SlidersHorizontal size={15} /> {filtrados.length} resultados</div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center text-zinc-500">Cargando producción…</div>
        ) : (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,.65fr)]">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#080d16]">
              <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(150px,.7fr)_minmax(120px,.55fr)_110px] gap-3 border-b border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                <div>Trabajo</div><div>Técnico</div><div>Estado</div><div className="text-right">Tiempo</div>
              </div>
              <div className="max-h-[720px] overflow-auto">
                {filtrados.length === 0 ? <div className="p-10 text-center text-sm text-zinc-500">No hay trabajos con estos filtros.</div> : filtrados.map((pedido) => {
                  const urgente = pedido.urgente || pedido.prioridad === 'urgente'
                  const estado = normalizarEstado(pedido.estado)
                  const active = selected?.id === pedido.id
                  return (
                    <button key={pedido.id} onClick={() => setSelectedId(pedido.id)} className={`grid w-full grid-cols-[minmax(0,1.6fr)_minmax(150px,.7fr)_minmax(120px,.55fr)_110px] gap-3 border-b border-white/5 px-5 py-4 text-left transition ${active ? 'bg-[#e2954d]/10' : 'hover:bg-white/[0.035]'}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-[#ffb870]">{pedido.numero || 'FS-SIN-NUM'}</span>{urgente && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-red-300">Urgente</span>}</div>
                        <div className="mt-1 truncate font-bold">{tituloPedido(pedido)}</div>
                        <div className="mt-1 truncate text-xs text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor'} · {serviciosTexto(pedido.servicios)}</div>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-zinc-300">{pedido.tecnico_asignado || <span className="text-amber-300">Sin asignar</span>}</div>
                      <div className="flex items-center"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${estadoClass(estado)}`}>{estadoLabel(estado)}</span></div>
                      <div className="flex items-center justify-end text-xs font-bold text-zinc-500">{tiempoHumano(minutosDesde(pedido.created_at))}</div>
                    </button>
                  )
                })}
              </div>
            </section>

            <aside className="2xl:sticky 2xl:top-5 2xl:self-start">
              {selected ? <WorkPanel pedido={selected} working={working === selected.id} onMove={moverPedido} onAssign={asignar} /> : <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-zinc-500">Selecciona un trabajo.</div>}
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function WorkPanel({ pedido, working, onMove, onAssign }: { pedido: AkCloudProduccionPedido; working: boolean; onMove: (id: string, estado: ProduccionEstado) => void; onAssign: (id: string, tecnico: string) => void }) {
  const estado = normalizarEstado(pedido.estado)
  const urgente = pedido.urgente || pedido.prioridad === 'urgente'
  return (
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#111827] to-[#090e17] p-5 shadow-2xl shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="font-mono text-xs font-bold text-[#ffb870]">{pedido.numero || 'FS-SIN-NUM'}</div><h2 className="mt-1 text-2xl font-bold leading-tight">{tituloPedido(pedido)}</h2><p className="mt-1 text-sm text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor'}</p></div>
        {urgente && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase text-red-300">Urgente</span>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2"><Info label="ECU" value={pedido.ecu} /><Info label="HW" value={pedido.hw} /><Info label="SW" value={pedido.sw} /><Info label="Precio" value={pedido.precio != null ? `${pedido.precio} €` : '—'} /></div>
      <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Servicios solicitados</div><div className="mt-2 font-bold text-[#ffb870]">{serviciosTexto(pedido.servicios)}</div></div>

      <div className="mt-5 space-y-3">
        <div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Técnico responsable</div><div className="rounded-2xl border border-white/10 bg-black/20 p-2"><CustomSelect value={pedido.tecnico_asignado || ''} onChange={(value) => onAssign(pedido.id, value)} disabled={working} placeholder="Sin técnico" options={[{ value: '', label: 'Sin técnico' }, ...tecnicos.map((t) => ({ value: t, label: t }))]} /></div></div>
        <div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Estado operativo</div><div className="rounded-2xl border border-white/10 bg-black/20 p-2"><CustomSelect value={estado} onChange={(value) => onMove(pedido.id, value as ProduccionEstado)} disabled={working} options={estados} /></div></div>
      </div>

      {(pedido.notas_core || pedido.notas_internas) && <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Notas</div><div className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{pedido.notas_core || pedido.notas_internas}</div></div>}

      <div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-2xl border border-white/10 bg-black/20 p-3"><FileCode2 size={17} className="text-zinc-500" /><div className="mt-2 text-[10px] uppercase text-zinc-600">ORI</div><div className="truncate text-xs font-bold">{pedido.ori_nombre || 'Pendiente'}</div></div><div className="rounded-2xl border border-white/10 bg-black/20 p-3"><FileCode2 size={17} className="text-zinc-500" /><div className="mt-2 text-[10px] uppercase text-zinc-600">MOD</div><div className="truncate text-xs font-bold">{pedido.mod_nombre || 'Sin entregar'}</div></div></div>

      <Link href={`/ak-cloud/${pedido.id}`} className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#e2954d] px-4 py-3.5 text-sm font-bold text-[#0a0d12] shadow-lg shadow-[#8a4a1f]/30 hover:bg-[#ffb870]">Abrir mesa completa del pedido <ArrowRight size={16} /></Link>
    </div>
  )
}

function QuickFilter({ active, onClick, label, value, icon: Icon, danger = false }: { active: boolean; onClick: () => void; label: string; value: number; icon: any; danger?: boolean }) {
  return <button onClick={onClick} className={`rounded-[1.4rem] border p-4 text-left transition ${active ? (danger ? 'border-red-500/40 bg-red-500/10' : 'border-[#e2954d]/40 bg-[#e2954d]/10') : 'border-white/10 bg-[#0B1220] hover:bg-white/[0.04]'}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</span><Icon size={16} className={danger ? 'text-red-300' : active ? 'text-[#ffb870]' : 'text-zinc-600'} /></div><div className="mt-2 text-2xl font-bold">{value}</div></button>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-2xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">{label}</div><div className="mt-1 truncate text-sm font-bold text-zinc-200">{value || '—'}</div></div>
}
