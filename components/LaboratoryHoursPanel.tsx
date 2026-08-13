'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarClock, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Schedule = Record<string, [string, string] | null>
const DAYS = [['mon','Lunes'],['tue','Martes'],['wed','Miércoles'],['thu','Jueves'],['fri','Viernes'],['sat','Sábado'],['sun','Domingo']] as const
const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-[#e2954d]'

export default function LaboratoryHoursPanel() {
  const [schedule, setSchedule] = useState<Schedule>({})
  const [timezone, setTimezone] = useState('Europe/Madrid')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/laboratory-status', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'No se pudo cargar el horario')
        setSchedule(json.status?.schedule || {})
        setTimezone(json.status?.timezone || 'Europe/Madrid')
      } catch (e: any) { toast.error(e.message || 'No se pudo cargar el horario') }
      finally { setLoading(false) }
    })()
  }, [])

  function setDay(day: string, value: [string, string] | null) {
    setSchedule((current) => ({ ...current, [day]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const { error } = await supabase.rpc('update_laboratory_schedule', { p_schedule: schedule })
      if (error) throw error
      toast.success('Horario semanal actualizado')
    } catch (e: any) { toast.error(e.message || 'No se pudo guardar el horario') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="card p-5 text-zinc-500">Cargando horario...</div>

  return <section className="card p-5">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-2 text-xl font-bold"><CalendarClock className="text-[#ffb870]" size={20}/>Horario del laboratorio</div><p className="mt-1 text-sm text-zinc-500">Define cuándo AK Cloud mostrará el laboratorio disponible. Zona: {timezone}</p></div>
      <button onClick={save} disabled={saving} className="btn btn-red inline-flex items-center gap-2"><Save size={16}/>{saving ? 'Guardando...' : 'Guardar horario'}</button>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">
      {DAYS.map(([key,label]) => {
        const hours = schedule[key] || null
        const enabled = Array.isArray(hours)
        return <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between"><b>{label}</b><label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={enabled} onChange={(e) => setDay(key, e.target.checked ? ['09:00','17:00'] : null)} className="accent-[#e2954d]"/>{enabled ? 'Abierto' : 'Cerrado'}</label></div>
          <div className="flex items-center gap-2"><input type="time" disabled={!enabled} className={inputClass} value={hours?.[0] || '09:00'} onChange={(e) => setDay(key,[e.target.value,hours?.[1] || '17:00'])}/><span className="text-zinc-600">—</span><input type="time" disabled={!enabled} className={inputClass} value={hours?.[1] || '17:00'} onChange={(e) => setDay(key,[hours?.[0] || '09:00',e.target.value])}/></div>
        </div>
      })}
    </div>
  </section>
}
