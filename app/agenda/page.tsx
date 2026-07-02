'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import AgendaEventModal from '@/components/AgendaEventModal'
import type { AgendaEvento, AgendaEventoInput } from '@/types/agenda'
import { createAgendaEvento, deleteAgendaEvento, getAgendaEventos, updateAgendaEvento } from '@/lib/services/agenda'
import { CalendarDays, Clock, MapPin, Plus, Trash2, Pencil, User, Car, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react'

function fmtDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(value))
}

function fmtTime(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const estadoClass: Record<string, string> = {
  programado: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  en_proceso: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  realizado: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  retrasado: 'bg-red-500/10 text-red-300 border-red-500/20',
  cancelado: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
}

const tipoClass: Record<string, string> = {
  cita: 'bg-white/5 text-zinc-300',
  recepcion: 'bg-purple-500/10 text-purple-300',
  entrega: 'bg-emerald-500/10 text-emerald-300',
  trabajo: 'bg-red-500/10 text-red-300',
  recordatorio: 'bg-orange-500/10 text-orange-300',
  file_service: 'bg-sky-500/10 text-sky-300',
}

function EventCard({ evento, onEdit, onDelete, onDone }: { evento: AgendaEvento; onEdit: () => void; onDelete: () => void; onDone: () => void }) {
  const delayed = evento.estado !== 'realizado' && evento.estado !== 'cancelado' && new Date(evento.fecha_inicio).getTime() < Date.now()
  return (
    <div className="card p-5 hover:border-red-500/30 transition group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] uppercase tracking-[0.18em] font-black px-2 py-1 rounded-full ${tipoClass[evento.tipo] || 'bg-white/5 text-zinc-300'}`}>{evento.tipo?.replace('_', ' ')}</span>
            <span className={`text-[10px] uppercase tracking-[0.18em] font-black px-2 py-1 rounded-full border ${estadoClass[evento.estado] || estadoClass.programado}`}>{evento.estado?.replace('_', ' ')}</span>
            {evento.prioridad === 'urgente' && <span className="text-[10px] uppercase tracking-[0.18em] font-black px-2 py-1 rounded-full bg-red-600 text-white">Urgente</span>}
            {delayed && <span className="text-[10px] uppercase tracking-[0.18em] font-black px-2 py-1 rounded-full bg-red-500/10 text-red-300 flex items-center gap-1"><AlertTriangle size={12} /> Retrasado</span>}
          </div>
          <div className="text-lg font-black truncate">{evento.titulo}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
            <span className="flex items-center gap-2"><Clock size={15} /> {fmtTime(evento.fecha_inicio)} {evento.fecha_fin ? `- ${fmtTime(evento.fecha_fin)}` : ''}</span>
            {evento.ubicacion && <span className="flex items-center gap-2"><MapPin size={15} /> {evento.ubicacion}</span>}
            {evento.tecnico && <span className="flex items-center gap-2"><User size={15} /> {evento.tecnico}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
          {evento.estado !== 'realizado' && <button onClick={onDone} title="Marcar realizado" className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={17} /></button>}
          <button onClick={onEdit} title="Editar" className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center"><Pencil size={17} /></button>
          <button onClick={onDelete} title="Eliminar" className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center justify-center"><Trash2 size={17} /></button>
        </div>
      </div>

      {(evento.cliente || evento.vehiculo || evento.expediente || evento.notas) && (
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {evento.cliente && <Link href={`/clientes/${evento.cliente.id}`} className="rounded-2xl bg-white/[0.03] p-3 hover:bg-white/[0.06]"><div className="text-xs text-zinc-500">Cliente</div><div className="font-bold mt-1">{evento.cliente.nombre}</div></Link>}
          {evento.vehiculo && <Link href={`/vehiculos/${evento.vehiculo.id}`} className="rounded-2xl bg-white/[0.03] p-3 hover:bg-white/[0.06]"><div className="text-xs text-zinc-500 flex items-center gap-1"><Car size={13} /> Vehículo</div><div className="font-bold mt-1">{[evento.vehiculo.marca, evento.vehiculo.modelo, evento.vehiculo.matricula].filter(Boolean).join(' · ')}</div></Link>}
          {evento.expediente && <Link href={`/expedientes/${evento.expediente.id}`} className="rounded-2xl bg-white/[0.03] p-3 hover:bg-white/[0.06]"><div className="text-xs text-zinc-500 flex items-center gap-1"><ClipboardList size={13} /> OT</div><div className="font-bold mt-1">{evento.expediente.numero_ot || evento.expediente.tipo_trabajo}</div></Link>}
          {evento.notas && <div className="md:col-span-3 text-zinc-500 text-sm leading-relaxed">{evento.notas}</div>}
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState<AgendaEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AgendaEvento | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('todos')

  async function load() {
    setLoading(true)
    try {
      setEventos(await getAgendaEventos())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(input: AgendaEventoInput) {
    if (editing) await updateAgendaEvento(editing.id, input)
    else await createAgendaEvento(input)
    setEditing(null)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este evento de agenda?')) return
    await deleteAgendaEvento(id)
    await load()
  }

  async function markDone(evento: AgendaEvento) {
    await updateAgendaEvento(evento.id, { estado: 'realizado' })
    await load()
  }

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    return eventos.filter(e => {
      const haystack = [e.titulo, e.tipo, e.estado, e.prioridad, e.tecnico, e.ubicacion, e.notas, e.cliente?.nombre, e.vehiculo?.matricula, e.vehiculo?.marca, e.vehiculo?.modelo, e.expediente?.numero_ot].filter(Boolean).join(' ').toLowerCase()
      const matchesSearch = !clean || haystack.includes(clean)
      const matchesFilter = filter === 'todos' || e.estado === filter || e.tipo === filter || e.prioridad === filter
      return matchesSearch && matchesFilter
    })
  }, [eventos, query, filter])

  const today = startOfDay(new Date())
  const todayEvents = eventos.filter(e => startOfDay(new Date(e.fecha_inicio)).getTime() === today.getTime()).length
  const pending = eventos.filter(e => !['realizado', 'cancelado'].includes(e.estado)).length
  const urgent = eventos.filter(e => e.prioridad === 'urgente').length
  const delayed = eventos.filter(e => !['realizado', 'cancelado'].includes(e.estado) && new Date(e.fecha_inicio).getTime() < Date.now()).length

  const grouped = useMemo(() => {
    const map = new Map<string, AgendaEvento[]>()
    filtered.forEach(e => {
      const key = new Date(e.fecha_inicio).toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-red-400 font-bold uppercase tracking-[0.2em] text-sm"><CalendarDays size={18} /> Planificador</div>
            <h2 className="text-3xl lg:text-4xl font-black mt-2">Agenda del laboratorio</h2>
            <p className="text-zinc-500 mt-2">Recepciones, entregas, trabajos programados, urgencias y recordatorios.</p>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn btn-red flex items-center gap-2"><Plus size={18} /> Nuevo evento</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5"><div className="text-zinc-500 text-sm">Hoy</div><div className="text-3xl font-black mt-2">{todayEvents}</div><div className="text-xs text-zinc-600 mt-1">eventos programados</div></div>
          <div className="card p-5"><div className="text-zinc-500 text-sm">Pendientes</div><div className="text-3xl font-black mt-2">{pending}</div><div className="text-xs text-zinc-600 mt-1">sin finalizar</div></div>
          <div className="card p-5"><div className="text-zinc-500 text-sm">Urgentes</div><div className="text-3xl font-black mt-2 text-red-400">{urgent}</div><div className="text-xs text-zinc-600 mt-1">prioridad máxima</div></div>
          <div className="card p-5"><div className="text-zinc-500 text-sm">Retrasados</div><div className="text-3xl font-black mt-2 text-orange-300">{delayed}</div><div className="text-xs text-zinc-600 mt-1">fecha vencida</div></div>
        </div>

        <div className="card p-4 flex flex-col lg:flex-row gap-3">
          <input className="input flex-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cita, matrícula, cliente, OT, técnico..." />
          <select className="input lg:w-64" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="programado">Programados</option>
            <option value="en_proceso">En proceso</option>
            <option value="realizado">Realizados</option>
            <option value="retrasado">Retrasados</option>
            <option value="urgente">Urgentes</option>
            <option value="recepcion">Recepciones</option>
            <option value="entrega">Entregas</option>
            <option value="trabajo">Trabajos laboratorio</option>
            <option value="file_service">File Service</option>
          </select>
        </div>

        {loading && <div className="card p-8 text-zinc-500">Cargando agenda...</div>}
        {!loading && grouped.length === 0 && <div className="card p-8 text-zinc-500">No hay eventos con estos filtros.</div>}

        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <section key={date} className="space-y-3">
              <div className="sticky top-0 z-10 py-2 bg-[#111827]/80 backdrop-blur">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0B1220] border border-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-zinc-300">
                  <CalendarDays size={16} className="text-red-400" /> {fmtDate(items[0].fecha_inicio)} <span className="text-zinc-600">· {items.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {items.map(e => (
                  <EventCard key={e.id} evento={e} onEdit={() => { setEditing(e); setModalOpen(true) }} onDelete={() => remove(e.id)} onDone={() => markDone(e)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <AgendaEventModal open={modalOpen} evento={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={save} />
    </AppShell>
  )
}
