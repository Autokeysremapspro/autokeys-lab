'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Activity, Clock3, Power, Save } from 'lucide-react'

type LaboratoryStatus = {
  id: string
  status: 'online' | 'busy' | 'closed'
  manual_override: boolean
  message: string | null
  estimated_minutes: number | null
  timezone: string
  schedule: Record<string, [string, string] | null>
  updated_at: string
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#e2954d]'

export default function LaboratoryStatusPanel() {
  const [data, setData] = useState<LaboratoryStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/laboratory-status', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el estado')
      setData(json.status)
    } catch (error: any) {
      toast.error(error.message || 'Error cargando estado del laboratorio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/laboratory-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: data.status,
          manual_override: data.manual_override,
          message: data.message,
          estimated_minutes: data.estimated_minutes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo guardar')
      setData(json.status)
      toast.success('Estado del laboratorio actualizado')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-400">Cargando estado del laboratorio...</section>
  if (!data) return null

  const tones = {
    online: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    busy: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    closed: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#ffb870]"><Activity size={18}/><span className="text-xs font-bold uppercase tracking-[0.2em]">AK Cloud Live</span></div>
          <h2 className="mt-2 text-lg font-bold text-white">Estado del laboratorio</h2>
          <p className="mt-1 text-sm text-slate-400">Controla lo que verá el taller en AK Cloud. El horario automático seguirá funcionando cuando el override esté desactivado.</p>
        </div>
        <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-bold uppercase ${tones[data.status]}`}><Power size={14}/>{data.status === 'busy' ? 'Alta carga' : data.status === 'online' ? 'Online' : 'Cerrado'}</div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</label>
          <select className={inputClass} value={data.status} onChange={(e) => setData({ ...data, status: e.target.value as LaboratoryStatus['status'] })}>
            <option value="online">Online</option>
            <option value="busy">Alta carga</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tiempo estimado</label>
          <div className="relative"><Clock3 className="absolute left-3 top-2.5 text-slate-500" size={16}/><input type="number" min={0} max={1440} className={`${inputClass} pl-9`} value={data.estimated_minutes ?? ''} onChange={(e) => setData({ ...data, estimated_minutes: e.target.value === '' ? null : Number(e.target.value) })} placeholder="minutos"/></div>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mensaje al taller</label>
          <input className={inputClass} value={data.message || ''} onChange={(e) => setData({ ...data, message: e.target.value })} placeholder="Ej. Alta carga · entrega estimada 60 min"/>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
          <input type="checkbox" checked={data.manual_override} onChange={(e) => setData({ ...data, manual_override: e.target.checked })} className="h-4 w-4 accent-[#e2954d]"/>
          <span><strong className="text-white">Override manual</strong><br/><span className="text-xs text-slate-500">Activado: fuerza el estado elegido. Desactivado: manda el horario automático.</span></span>
        </label>
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e2954d] px-4 py-2.5 text-sm font-bold text-[#0a0d12] hover:bg-[#ffb870] disabled:opacity-50"><Save size={16}/>{saving ? 'Guardando...' : 'Guardar estado'}</button>
      </div>
    </section>
  )
}
