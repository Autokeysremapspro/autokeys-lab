'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { ArrowLeft, Building2, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'

type Solicitud = {
  id: string
  auth_user_id: string | null
  email: string
  empresa: string
  nombre: string
  telefono?: string | null
  ciudad?: string | null
  especialidad?: string | null
  herramientas?: string[] | null
  estado: string
  motivo_estado?: string | null
  created_at: string
}

type Plan = { id: string; nombre: string; slug: string; creditos_mes?: number }

function estadoClass(estado?: string) {
  switch (estado) {
    case 'aprobada': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'rechazada': return 'border-red-500/30 bg-red-500/10 text-red-300'
    case 'informacion_solicitada': return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    default: return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  }
}

function formatDate(date?: string) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default function AkCloudSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('pendiente')
  const [working, setWorking] = useState<string | null>(null)
  const [planPorSolicitud, setPlanPorSolicitud] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/ak-cloud/distribuidores')
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      setSolicitudes(payload.solicitudes || [])
      setPlanes(payload.planes || [])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => solicitudes.filter((s) => estado === 'todos' || (s.estado || 'pendiente') === estado),
    [solicitudes, estado]
  )

  async function aprobar(solicitud: Solicitud) {
    const planId = planPorSolicitud[solicitud.id] || planes[0]?.id
    if (!planId) return toast.error('No hay ningún plan creado todavía — ve a "Planes AK" y crea al menos uno.')
    setWorking(solicitud.id)
    try {
      const res = await fetch('/api/ak-cloud/distribuidores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: solicitud.id, action: 'aprobar', plan_id: planId }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      const nombrePlan = planes.find((p) => p.id === planId)?.nombre || 'plan'
      toast.success(`${solicitud.empresa} aprobado como distribuidor · ${nombrePlan}`)
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo aprobar')
    } finally {
      setWorking(null)
    }
  }

  async function rechazar(solicitud: Solicitud) {
    const motivo = prompt('Motivo del rechazo (se lo verá el solicitante):', '')
    if (motivo === null) return
    setWorking(solicitud.id)
    try {
      const res = await fetch('/api/ak-cloud/distribuidores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: solicitud.id, action: 'rechazar', motivo }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      toast.success('Solicitud rechazada')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo rechazar')
    } finally {
      setWorking(null)
    }
  }

  const pendientes = solicitudes.filter((s) => (s.estado || 'pendiente') === 'pendiente').length

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#101827] to-[#19070d] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/ak-cloud" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
                <ArrowLeft size={16} /> Volver a AK Cloud
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <ShieldCheck size={16} /> Alta controlada de distribuidores
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Solicitudes</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Cada persona que se registra en AK Cloud aparece aquí como pendiente. No entra al portal hasta que la apruebes.
              </p>
            </div>
            <button onClick={load} className="btn btn-dark inline-flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
          </div>
        </section>

        {pendientes > 0 && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
            Tienes {pendientes} solicitud{pendientes === 1 ? '' : 'es'} pendiente{pendientes === 1 ? '' : 's'} de revisar.
          </div>
        )}

        <section className="flex flex-wrap gap-2">
          {['pendiente', 'aprobada', 'rechazada', 'informacion_solicitada', 'todos'].map((item) => (
            <button
              key={item}
              onClick={() => setEstado(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-wider transition ${estado === item ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="card p-8 text-zinc-500">Cargando solicitudes...</div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-zinc-500">No hay solicitudes en este estado.</div>
          ) : (
            filtered.map((s) => (
              <article key={s.id} className="card p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${estadoClass(s.estado)}`}>{s.estado || 'pendiente'}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-zinc-400">
                        <Clock3 size={12} className="mr-1 inline" /> {formatDate(s.created_at)}
                      </span>
                    </div>
                    <h3 className="flex items-center gap-2 text-2xl font-black"><Building2 size={20} className="text-red-400" /> {s.empresa}</h3>
                    <p className="mt-1 text-zinc-500">{s.nombre} · {s.email} · {s.telefono || 'sin teléfono'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                      {s.ciudad && <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">{s.ciudad}</span>}
                      {s.especialidad && <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">{s.especialidad}</span>}
                      {(s.herramientas || []).map((h) => <span key={h} className="rounded-full border border-white/10 bg-black/25 px-3 py-1">{h}</span>)}
                    </div>
                    {s.motivo_estado && <p className="mt-3 text-sm text-zinc-500">Motivo: {s.motivo_estado}</p>}
                  </div>
                  {(s.estado || 'pendiente') === 'pendiente' && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Plan a asignar</label>
                      <select
                        className="min-w-[180px]"
                        value={planPorSolicitud[s.id] || planes[0]?.id || ''}
                        onChange={(e) => setPlanPorSolicitud((cur) => ({ ...cur, [s.id]: e.target.value }))}
                      >
                        {planes.length === 0 && <option value="">Sin planes creados</option>}
                        {planes.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button disabled={working === s.id} onClick={() => aprobar(s)} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
                          <CheckCircle2 size={18} /> Aprobar
                        </button>
                        <button disabled={working === s.id} onClick={() => rechazar(s)} className="btn btn-dark inline-flex items-center gap-2 text-red-300 disabled:opacity-50">
                          <XCircle size={18} /> Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  )
}
