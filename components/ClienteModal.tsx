'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente } from '@/types/autokeys'

type Props = { open: boolean; cliente?: Cliente | null; onClose: () => void; onSave: (payload: Partial<Cliente>) => Promise<void> }

const inputClass = 'w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-[#ef202d]/50 focus:bg-white/[0.04] focus:ring-4 focus:ring-[#ef202d]/[0.07]'
const labelClass = 'mb-2 block text-[12px] font-semibold text-zinc-400'

export default function ClienteModal({ open, cliente, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Cliente>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setForm(cliente || { nombre: '', telefono: '', email: '', nif: '', direccion: '', codigo_postal: '', poblacion: '', provincia: '', notas: '' })
  }, [open, cliente])
  if (!open) return null

  const set = (key: keyof Cliente, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  async function submit() {
    if (!form.nombre?.trim()) return
    setLoading(true)
    try { await onSave(form); onClose() } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md sm:p-5" onMouseDown={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0d12] shadow-[0_32px_100px_rgba(0,0,0,.68)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Clientes</div><h2 className="mt-1 text-[22px] font-semibold tracking-tight text-white sm:text-[24px]">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2><p className="mt-1 text-[13px] text-zinc-500">Datos administrativos y de contacto.</p></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white"><X size={18}/></button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 sm:p-6 md:grid-cols-2">
          <Field label="Nombre *" value={form.nombre || ''} onChange={v => set('nombre', v)} />
          <Field label="Teléfono" value={form.telefono || ''} onChange={v => set('telefono', v)} />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} />
          <Field label="NIF / CIF" value={form.nif || ''} onChange={v => set('nif', v)} />
          <div className="md:col-span-2"><Field label="Dirección" value={form.direccion || ''} onChange={v => set('direccion', v)} /></div>
          <Field label="Código postal" value={form.codigo_postal || ''} onChange={v => set('codigo_postal', v)} />
          <Field label="Población" value={form.poblacion || ''} onChange={v => set('poblacion', v)} />
          <Field label="Provincia" value={form.provincia || ''} onChange={v => set('provincia', v)} />
          <div className="hidden md:block" />
          <label className="md:col-span-2"><span className={labelClass}>Observaciones</span><textarea value={form.notas || ''} onChange={e => set('notas', e.target.value)} rows={4} className={inputClass} /></label>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-2.5 text-[13px] font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancelar</button>
          <button type="button" onClick={submit} disabled={loading || !form.nombre?.trim()} className="min-h-[44px] rounded-xl border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar cliente'}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input value={value} onChange={e => onChange(e.target.value)} className={inputClass} /></label>
}
