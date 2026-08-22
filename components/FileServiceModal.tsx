'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { FileServiceJob } from '@/types/autokeys'
import CustomSelect from '@/components/ak/CustomSelect'

type Props = { open: boolean; job?: FileServiceJob | null; onClose: () => void; onSubmit: (payload: Partial<FileServiceJob>) => Promise<void> }

const emptyForm: Partial<FileServiceJob> = { taller: '', marca: '', modelo: '', motor: '', matricula: '', ecu: '', hw: '', sw: '', servicio: 'Stage 1', estado: 'pendiente', precio: 0, pagado: false, notas: '' }
const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-[#ef202d]/45 focus:bg-white/[0.035] focus:ring-4 focus:ring-[#ef202d]/[0.06]'
const labelClass = 'mb-1.5 block text-[11px] font-semibold text-zinc-500'

export default function FileServiceModal({ open, job, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<FileServiceJob>>(emptyForm)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(job || emptyForm) }, [job, open])
  if (!open) return null
  const setField = (field: keyof FileServiceJob, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { await onSubmit(form); onClose() } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0d12] shadow-[0_28px_90px_rgba(0,0,0,.62)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">File Service</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{job ? 'Editar solicitud' : 'Nueva solicitud'}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">Trabajo de distribuidor o taller externo.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white"><X size={16}/></button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5">
          <div className="grid gap-3.5 md:grid-cols-3">
            <Input label="Taller / Distribuidor" value={form.taller} onChange={(v) => setField('taller', v)} required />
            <Input label="Marca" value={form.marca} onChange={(v) => setField('marca', v)} />
            <Input label="Modelo" value={form.modelo} onChange={(v) => setField('modelo', v)} />
            <Input label="Motor" value={form.motor} onChange={(v) => setField('motor', v)} />
            <Input label="Matrícula" value={form.matricula} onChange={(v) => setField('matricula', v)} />
            <Input label="ECU" value={form.ecu} onChange={(v) => setField('ecu', v)} />
            <Input label="HW" value={form.hw} onChange={(v) => setField('hw', v)} />
            <Input label="SW" value={form.sw} onChange={(v) => setField('sw', v)} />
            <label><span className={labelClass}>Servicio</span><CustomSelect value={form.servicio || 'Stage 1'} onChange={(v) => setField('servicio', v)} options={['Stage 1','Stage 2','DPF OFF','EGR OFF','AdBlue / SCR OFF','IMMO OFF','Clone / Repair','Hardcut','Pops & Bangs','DTC Off','Speed Limit Off','Otro'].map((s)=>({value:s,label:s}))}/></label>
            <label><span className={labelClass}>Estado</span><CustomSelect value={form.estado || 'pendiente'} onChange={(v) => setField('estado', v)} options={[{value:'pendiente',label:'Pendiente'},{value:'en_proceso',label:'En proceso'},{value:'enviado',label:'Enviado'},{value:'revision',label:'Revisión'},{value:'finalizado',label:'Finalizado'},{value:'cancelado',label:'Cancelado'}]}/></label>
            <Input label="Precio" type="number" value={form.precio ?? 0} onChange={(v) => setField('precio', Number(v))} />
            <label className="mt-[22px] flex min-h-[42px] items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 text-xs font-semibold text-zinc-400"><input type="checkbox" checked={Boolean(form.pagado)} onChange={(e)=>setField('pagado',e.target.checked)} className="accent-[#ef202d]"/> Pagado</label>
          </div>
          <label className="mt-4 block"><span className={labelClass}>Notas</span><textarea value={form.notas || ''} onChange={(e)=>setField('notas',e.target.value)} rows={4} className={inputClass} placeholder="Observaciones del archivo, peticiones del taller, avisos..."/></label>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-white/[0.07] px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancelar</button>
          <button disabled={saving} className="rounded-lg border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, type='text', required=false }: any) {
  return <label><span className={labelClass}>{label}</span><input required={required} type={type} value={value || ''} onChange={(e)=>onChange(e.target.value)} className={inputClass}/></label>
}
