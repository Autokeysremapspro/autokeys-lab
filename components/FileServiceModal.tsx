'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { FileServiceJob } from '@/types/autokeys'
import CustomSelect from '@/components/ak/CustomSelect'

type Props = { open: boolean; job?: FileServiceJob | null; onClose: () => void; onSubmit: (payload: Partial<FileServiceJob>) => Promise<void> }
const emptyForm: Partial<FileServiceJob> = { taller: '', marca: '', modelo: '', motor: '', matricula: '', ecu: '', hw: '', sw: '', servicio: 'Stage 1', estado: 'pendiente', precio: 0, pagado: false, notas: '' }
const inputClass = 'w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-[#ef202d]/50 focus:bg-white/[0.04] focus:ring-4 focus:ring-[#ef202d]/[0.07]'
const labelClass = 'mb-2 block text-[12px] font-semibold text-zinc-400'

export default function FileServiceModal({ open, job, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<FileServiceJob>>(emptyForm)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(job || emptyForm) }, [job, open])
  if (!open) return null
  const setField = (field: keyof FileServiceJob, value: any) => setForm(prev => ({ ...prev, [field]: value }))
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSaving(true); try { await onSubmit(form); onClose() } finally { setSaving(false) } }

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md sm:p-5" onMouseDown={onClose}>
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0d12] shadow-[0_32px_100px_rgba(0,0,0,.68)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6 sm:py-5">
          <div><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">File Service</div><h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white sm:text-[24px]">{job ? 'Editar solicitud' : 'Nueva solicitud'}</h2><p className="mt-1 text-[13px] text-zinc-500">Trabajo de distribuidor o taller externo.</p></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white"><X size={18}/></button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Taller / Distribuidor" value={form.taller} onChange={(v) => setField('taller', v)} required />
            <Input label="Marca" value={form.marca} onChange={(v) => setField('marca', v)} />
            <Input label="Modelo" value={form.modelo} onChange={(v) => setField('modelo', v)} />
            <Input label="Motor" value={form.motor} onChange={(v) => setField('motor', v)} />
            <Input label="Matrícula" value={form.matricula} onChange={(v) => setField('matricula', v)} />
            <Input label="ECU" value={form.ecu} onChange={(v) => setField('ecu', v)} />
            <Input label="HW" value={form.hw} onChange={(v) => setField('hw', v)} />
            <Input label="SW" value={form.sw} onChange={(v) => setField('sw', v)} />
            <label><span className={labelClass}>Servicio</span><CustomSelect className="z-20" value={form.servicio || 'Stage 1'} onChange={(v) => setField('servicio', v)} options={['Stage 1','Stage 2','DPF OFF','EGR OFF','AdBlue / SCR OFF','IMMO OFF','Clone / Repair','Hardcut','Pops & Bangs','DTC Off','Speed Limit Off','Otro'].map((s)=>({value:s,label:s}))}/></label>
            <label><span className={labelClass}>Estado</span><CustomSelect className="z-10" value={form.estado || 'pendiente'} onChange={(v) => setField('estado', v)} options={[{value:'pendiente',label:'Pendiente'},{value:'en_proceso',label:'En proceso'},{value:'enviado',label:'Enviado'},{value:'revision',label:'Revisión'},{value:'finalizado',label:'Finalizado'},{value:'cancelado',label:'Cancelado'}]}/></label>
            <Input label="Precio" type="number" value={form.precio ?? 0} onChange={(v) => setField('precio', Number(v))} />
            <label className="flex min-h-[48px] items-center gap-3 self-end rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 text-[13px] font-semibold text-zinc-300"><input type="checkbox" checked={Boolean(form.pagado)} onChange={(e)=>setField('pagado',e.target.checked)} className="accent-[#ef202d]"/> Pagado</label>
          </div>
          <label className="mt-5 block"><span className={labelClass}>Notas</span><textarea value={form.notas || ''} onChange={(e)=>setField('notas',e.target.value)} rows={4} className={inputClass} placeholder="Observaciones del archivo, peticiones del taller, avisos..."/></label>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-2.5 text-[13px] font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancelar</button>
          <button disabled={saving} className="min-h-[44px] rounded-xl border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, type='text', required=false }: any) { return <label><span className={labelClass}>{label}</span><input required={required} type={type} value={value || ''} onChange={(e)=>onChange(e.target.value)} className={inputClass}/></label> }
