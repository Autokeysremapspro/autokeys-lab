'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { getAuditoriaEventos, getAuditoriaStats } from '@/lib/services/auditoria'
import type { AuditoriaEvento } from '@/types/auditoria'
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Search, ShieldAlert, UserRound } from 'lucide-react'

const severidadStyles: Record<string, string> = {
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const severidadLabels: Record<string, string> = {
  info: 'Info',
  success: 'Correcto',
  warning: 'Aviso',
  danger: 'Crítico',
}

function fmtDate(value?: string) {
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

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<AuditoriaEvento[]>([])
  const [stats, setStats] = useState({ total: 0, hoy: 0, danger: 0, warning: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modulo, setModulo] = useState('todos')
  const [severidad, setSeveridad] = useState('todas')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [rows, s] = await Promise.all([
        getAuditoriaEventos({ search, modulo, severidad, limit: 300 }),
        getAuditoriaStats(),
      ])
      setEventos(rows)
      setStats(s)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la auditoría')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [search, modulo, severidad])

  const modulos = useMemo(() => {
    const unique = Array.from(new Set(eventos.map(e => e.modulo).filter(Boolean))).sort()
    return unique
  }, [eventos])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Sistema</p>
            <h2 className="text-4xl font-black mt-1">Auditoría</h2>
            <p className="text-zinc-500 mt-2 max-w-3xl">
              Registro de actividad de Autokeys Core: cambios de clientes, vehículos, OT, facturas, stock, usuarios y configuración.
            </p>
          </div>
          <button onClick={load} className="btn btn-red flex items-center gap-2">
            <Activity size={18} /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatBox icon={Database} label="Eventos totales" value={stats.total} />
          <StatBox icon={Clock} label="Eventos hoy" value={stats.hoy} />
          <StatBox icon={AlertTriangle} label="Avisos" value={stats.warning} />
          <StatBox icon={ShieldAlert} label="Críticos" value={stats.danger} />
        </div>

        <div className="card p-5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_220px] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario, módulo, acción, entidad o descripción..."
                className="input pl-11 w-full"
              />
            </div>
            <select value={modulo} onChange={(e) => setModulo(e.target.value)} className="input">
              <option value="todos">Todos los módulos</option>
              {modulos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={severidad} onChange={(e) => setSeveridad(e.target.value)} className="input">
              <option value="todas">Todas las severidades</option>
              <option value="info">Info</option>
              <option value="success">Correcto</option>
              <option value="warning">Aviso</option>
              <option value="danger">Crítico</option>
            </select>
          </div>
        </div>

        {error && <div className="card border-red-500/30 bg-red-950/30 p-4 text-red-200">{error}</div>}

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">Registro de actividad</h3>
              <p className="text-sm text-zinc-500">Últimos movimientos registrados en el sistema.</p>
            </div>
            {loading && <span className="text-sm text-zinc-500">Cargando...</span>}
          </div>

          <div className="divide-y divide-white/10">
            {!loading && eventos.length === 0 && (
              <div className="p-10 text-center text-zinc-500">No hay eventos de auditoría todavía.</div>
            )}

            {eventos.map((evento) => (
              <div key={evento.id} className="p-5 hover:bg-white/[0.03] transition">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {evento.severidad === 'success' ? <CheckCircle2 size={20} className="text-emerald-300" /> : <UserRound size={20} className="text-zinc-300" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-lg">{evento.accion}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${severidadStyles[evento.severidad] || severidadStyles.info}`}>
                          {severidadLabels[evento.severidad] || evento.severidad}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                          {evento.modulo}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-400 mt-1">
                        {evento.usuario_nombre || evento.usuario_email || 'Sistema'}
                        {evento.entidad_resumen ? ` · ${evento.entidad_resumen}` : ''}
                      </p>

                      {evento.descripcion && (
                        <p className="text-zinc-300 mt-3 leading-relaxed">{evento.descripcion}</p>
                      )}

                      {(evento.entidad_tipo || evento.entidad_id) && (
                        <p className="text-xs text-zinc-600 mt-3 font-mono">
                          {evento.entidad_tipo || 'entidad'} · {evento.entidad_id || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-500 xl:text-right shrink-0">
                    <div>{fmtDate(evento.created_at)}</div>
                    {evento.ip && <div className="mt-1">IP: {evento.ip}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
