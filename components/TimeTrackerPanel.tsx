'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, Play, Square, TimerReset } from 'lucide-react'
import { TiempoService } from '@/lib/services/tiempos'
import type { TiempoTrabajo } from '@/types/autokeys'

type Props = {
  expedienteId: string
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

function formatSeconds(total?: number | null) {
  const seconds = Math.max(0, total || 0)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimeTrackerPanel({ expedienteId, onEvent }: Props) {
  const [items, setItems] = useState<TiempoTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [notes, setNotes] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try { setItems(await TiempoService.getByExpediente(expedienteId)) }
    catch (err: any) { setError(err.message || 'No se pudieron cargar los tiempos') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [expedienteId])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const active = items.find(i => !i.ended_at)
  const totalSeconds = useMemo(() => items.reduce((sum, item) => sum + (item.duration_seconds || 0), 0), [items])
  const activeSeconds = active ? Math.max(0, Math.round((now - new Date(active.started_at).getTime()) / 1000)) : 0

  async function start() {
    setSaving(true); setError('')
    try {
      await TiempoService.start(expedienteId, 'Carlos')
      await onEvent?.('Cronómetro iniciado', 'Se ha iniciado una sesión de trabajo')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo iniciar') }
    finally { setSaving(false) }
  }

  async function stop() {
    if (!active) return
    setSaving(true); setError('')
    try {
      const seconds = await TiempoService.stop(active.id, notes.trim() || undefined)
      await onEvent?.('Cronómetro finalizado', `Tiempo registrado: ${formatSeconds(seconds)}`)
      setNotes('')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo finalizar') }
    finally { setSaving(false) }
  }

  return (
    <div className="grid xl:grid-cols-3 gap-5">
      <div className="card p-6 xl:col-span-2">
        <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><Clock3 className="text-red-300" /> Cronómetro de trabajo</h3>
        <p className="text-zinc-500 mb-6">Controla el tiempo real invertido en esta OT. Más adelante servirá para rentabilidad y estadísticas por tipo de trabajo.</p>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 mb-4">{error}</div>}

        <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-8 text-center mb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Sesión actual</p>
          <div className="text-5xl md:text-7xl font-black tabular-nums">{formatSeconds(activeSeconds)}</div>
          {active && <p className="text-zinc-500 mt-3">Iniciado: {new Date(active.started_at).toLocaleString('es-ES')}</p>}
        </div>

        {active && <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas de esta sesión de trabajo..." className="mb-4" />}

        <div className="flex flex-wrap gap-3">
          {!active ? (
            <button disabled={saving} onClick={start} className="btn btn-red inline-flex items-center gap-2"><Play size={18} /> Iniciar trabajo</button>
          ) : (
            <button disabled={saving} onClick={stop} className="btn btn-red inline-flex items-center gap-2"><Square size={18} /> Finalizar trabajo</button>
          )}
          <button disabled={saving} onClick={load} className="btn btn-dark inline-flex items-center gap-2"><TimerReset size={18} /> Actualizar</button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-2xl font-black mb-5">Resumen</h3>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4"><p className="text-xs text-zinc-500 font-black uppercase">Tiempo total cerrado</p><p className="text-3xl font-black tabular-nums">{formatSeconds(totalSeconds)}</p></div>
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4"><p className="text-xs text-zinc-500 font-black uppercase">Sesiones</p><p className="text-3xl font-black">{items.length}</p></div>
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4"><p className="text-xs text-zinc-500 font-black uppercase">Estado</p><p className={active ? 'text-emerald-300 font-black' : 'text-zinc-300 font-black'}>{active ? 'En marcha' : 'Parado'}</p></div>
        </div>
      </div>

      <div className="card p-6 xl:col-span-3">
        <h3 className="text-2xl font-black mb-5">Historial de tiempos</h3>
        {loading ? <div className="text-zinc-500">Cargando...</div> : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-black">{item.usuario || 'Autokeys Core'}</p>
                  <p className="text-sm text-zinc-500">{new Date(item.started_at).toLocaleString('es-ES')} {item.ended_at ? `→ ${new Date(item.ended_at).toLocaleString('es-ES')}` : '→ en marcha'}</p>
                  {item.notas && <p className="text-zinc-400 mt-2">{item.notas}</p>}
                </div>
                <p className="text-2xl font-black tabular-nums">{item.ended_at ? formatSeconds(item.duration_seconds) : formatSeconds(activeSeconds)}</p>
              </div>
            ))}
            {!items.length && <div className="text-zinc-500">Aún no hay tiempos registrados.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
