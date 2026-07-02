'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { eliminarNotificacion, getNotificaciones, getNotificacionesStats, marcarNotificacionLeida, marcarTodasLeidas } from '@/lib/services/notificaciones'
import type { Notificacion } from '@/types/notificaciones'
import { AlertTriangle, Bell, CheckCheck, Clock, Info, Search, ShieldAlert, Trash2 } from 'lucide-react'

const tipoStyles: Record<string, string> = {
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
}

function fmtDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400">
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function iconFor(tipo: string) {
  if (tipo === 'danger') return ShieldAlert
  if (tipo === 'warning') return AlertTriangle
  return Info
}

export default function NotificacionesPage() {
  const [items, setItems] = useState<Notificacion[]>([])
  const [stats, setStats] = useState({ total: 0, noLeidas: 0, hoy: 0, urgentes: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<'todas' | 'leidas' | 'no_leidas'>('todas')
  const [tipo, setTipo] = useState('todos')
  const [modulo, setModulo] = useState('todos')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [rows, s] = await Promise.all([
        getNotificaciones({ search, estado, tipo, modulo, limit: 300 }),
        getNotificacionesStats(),
      ])
      setItems(rows)
      setStats(s)
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las notificaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [search, estado, tipo, modulo])

  const modulos = useMemo(() => Array.from(new Set(items.map(i => i.modulo).filter(Boolean))).sort(), [items])

  async function markRead(id: string) {
    await marcarNotificacionLeida(id)
    await load()
  }

  async function markAll() {
    await marcarTodasLeidas()
    await load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta notificación?')) return
    await eliminarNotificacion(id)
    await load()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Centro de operaciones</p>
            <h2 className="text-4xl font-black mt-1">Notificaciones</h2>
            <p className="text-zinc-500 mt-2 max-w-3xl">
              Centro de avisos de Autokeys Core: urgencias, facturas pendientes, stock bajo, File Service, agenda y eventos del sistema.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAll} className="btn btn-red flex items-center gap-2">
              <CheckCheck size={18} /> Marcar todo leído
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatBox icon={Bell} label="Total" value={stats.total} />
          <StatBox icon={Info} label="No leídas" value={stats.noLeidas} />
          <StatBox icon={Clock} label="Hoy" value={stats.hoy} />
          <StatBox icon={AlertTriangle} label="Alta prioridad" value={stats.urgentes} />
        </div>

        <div className="card p-5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_170px_170px_190px] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, mensaje, módulo o prioridad..."
                className="input pl-11 w-full"
              />
            </div>
            <select value={estado} onChange={(e) => setEstado(e.target.value as any)} className="input">
              <option value="todas">Todas</option>
              <option value="no_leidas">No leídas</option>
              <option value="leidas">Leídas</option>
            </select>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
              <option value="todos">Todos los tipos</option>
              <option value="info">Info</option>
              <option value="success">Correcto</option>
              <option value="warning">Aviso</option>
              <option value="danger">Crítico</option>
            </select>
            <select value={modulo} onChange={(e) => setModulo(e.target.value)} className="input">
              <option value="todos">Todos los módulos</option>
              {modulos.map(m => <option key={m || ''} value={m || ''}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="card border-red-500/30 bg-red-950/30 p-4 text-red-200">{error}</div>}

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">Bandeja de avisos</h3>
              <p className="text-sm text-zinc-500">Avisos persistentes creados por el sistema o por automatizaciones.</p>
            </div>
            {loading && <span className="text-sm text-zinc-500">Cargando...</span>}
          </div>

          <div className="divide-y divide-white/10">
            {!loading && items.length === 0 && (
              <div className="p-10 text-center text-zinc-500">No hay notificaciones con esos filtros.</div>
            )}

            {items.map((item) => {
              const Icon = iconFor(item.tipo)
              return (
                <div key={item.id} className={`p-5 transition ${item.leida ? 'opacity-60' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${tipoStyles[item.tipo] || tipoStyles.info}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-lg">{item.titulo}</span>
                          {!item.leida && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-red-600 text-white">NUEVA</span>}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${tipoStyles[item.tipo] || tipoStyles.info}`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                            {item.modulo || 'Sistema'}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                            {item.prioridad}
                          </span>
                        </div>

                        {item.mensaje && <p className="text-zinc-300 mt-3 leading-relaxed">{item.mensaje}</p>}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {item.href && (
                            <Link href={item.href} className="btn btn-soft text-sm">
                              {item.accion_texto || 'Abrir'}
                            </Link>
                          )}
                          {!item.leida && (
                            <button onClick={() => markRead(item.id)} className="btn btn-soft text-sm">
                              Marcar leída
                            </button>
                          )}
                          <button onClick={() => remove(item.id)} className="btn btn-soft text-sm text-red-300 flex items-center gap-2">
                            <Trash2 size={15} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-zinc-500 xl:text-right shrink-0">
                      <div>{fmtDate(item.created_at)}</div>
                      {item.read_at && <div className="mt-1">Leída: {fmtDate(item.read_at)}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
