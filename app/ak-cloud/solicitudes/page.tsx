'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { Building2, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react'

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

function estadoTone(estado?: string): 'green' | 'red' | 'amber' | 'blue' {
  switch (estado) {
    case 'aprobada': return 'green'
    case 'rechazada': return 'red'
    case 'informacion_solicitada': return 'amber'
    default: return 'blue'
  }
}

function formatDate(date?: string) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default function AkCloudSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('pendiente')
  const [working, setWorking] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/ak-cloud/distribuidores')
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      setSolicitudes(payload.solicitudes || [])
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
    setWorking(solicitud.id)
    try {
      const res = await fetch('/api/ak-cloud/distribuidores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: solicitud.id, action: 'aprobar', plan_id: null }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      toast.success(`${solicitud.empresa} aprobado como distribuidor · pago por archivo`)
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
    <LabShell
      title="Solicitudes"
      subtitle="Cada persona que se registra en AK Cloud aparece aquí como pendiente. No entra al portal hasta que la apruebes."
      actions={
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/[0.08]">
          <RefreshCw size={15} /> Actualizar
        </button>
      }
    >
      <div className="space-y-4">
        {pendientes > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
            Tienes {pendientes} solicitud{pendientes === 1 ? '' : 'es'} pendiente{pendientes === 1 ? '' : 's'} de revisar.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {['pendiente', 'aprobada', 'rechazada', 'informacion_solicitada', 'todos'].map((item) => (
            <button
              key={item}
              onClick={() => setEstado(item)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${estado === item ? 'bg-[#c81f2a] text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <LabPanel><div className="py-6 text-center text-sm text-zinc-500">Cargando solicitudes...</div></LabPanel>
          ) : filtered.length === 0 ? (
            <LabPanel><div className="py-6 text-center text-sm text-zinc-500">No hay solicitudes en este estado.</div></LabPanel>
          ) : (
            filtered.map((s) => (
              <LabPanel key={s.id}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <LabBadge tone={estadoTone(s.estado)}>{s.estado || 'pendiente'}</LabBadge>
                      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-zinc-400">
                        <Clock3 size={12} /> {formatDate(s.created_at)}
                      </span>
                    </div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Building2 size={18} className="text-[#ff5468]" /> {s.empresa}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{s.nombre} · {s.email} · {s.telefono || 'sin teléfono'}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-zinc-400">
                      {s.ciudad && <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1">{s.ciudad}</span>}
                      {s.especialidad && <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1">{s.especialidad}</span>}
                      {(s.herramientas || []).map((h) => <span key={h} className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1">{h}</span>)}
                    </div>
                    {s.motivo_estado && <p className="mt-2.5 text-sm text-zinc-500">Motivo: {s.motivo_estado}</p>}
                  </div>
                  {(s.estado || 'pendiente') === 'pendiente' && (
                    <div className="flex shrink-0 gap-2">
                      <button disabled={working === s.id} onClick={() => aprobar(s)} className="flex items-center gap-1.5 rounded-xl bg-[#c81f2a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#e2242f] disabled:opacity-50">
                        <CheckCircle2 size={15} /> Aprobar
                      </button>
                      <button disabled={working === s.id} onClick={() => rechazar(s)} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-white/[0.08] disabled:opacity-50">
                        <XCircle size={15} /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </LabPanel>
            ))
          )}
        </div>
      </div>
    </LabShell>
  )
}
