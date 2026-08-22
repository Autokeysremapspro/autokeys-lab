'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente } from '@/types/autokeys'

type Props = {
  open: boolean
  cliente?: Cliente | null
  onClose: () => void
  onSave: (payload: Partial<Cliente>) => Promise<void>
}

const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-[#ef202d]/45 focus:bg-white/[0.035] focus:ring-4 focus:ring-[#ef202d]/[0.06]'
const labelClass = 'mb-1.5 block text-[11px] font-semibold text-zinc-500'

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
    try {
      await onSave(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0d12] shadow-[0_28px_90px_rgba(0,0,0,.62)]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Clientes</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <p className="mt-0.5 text-xs text-zinc-600">Datos administrativos y de contacto.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white"><X size={16}/></button>
        </div>

        <div className="grid gap-3.5 p-5 md:grid-cols-2">
          <Field label="Nombre *" value={form.nombre || ''} onChange={v => set('nombre', v)} />
          <Field label="Teléfono" value={form.telefono || ''} onChange={v => set('telefono', v)} />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} />
          <Field label="NIF / CIF" value={form.nif || ''} onChange={v => set('nif', v)} />
          <div className="md:col-span-2"><Field label="Dirección" value={form.direccion || ''} onChange={v => set('direccion', v)} /></div>
          <Field label="Código postal" value={form.codigo_postal || ''} onChange={v => set('codigo_postal', v)} />
          <Field label="Población" value={form.poblacion || ''} onChange={v => set('poblacion', v)} />
          <Field label="Provincia" value={form.provincia || ''} onChange={v => set('provincia', v)} />
          <div />
          <label className="md:col-span-2">
            <span className={labelClass}>Observaciones</span>
            <textarea value={form.notas || ''} onChange={e => set('notas', e.target.value)} rows={4} className={inputClass} />
          </label>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-white/[0.07] px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancelar</button>
          <button type="button" onClick={submit} disabled={loading || !form.nombre?.trim()} className="rounded-lg border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar cliente'}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input value={value} onChange={e => onChange(e.target.value)} className={inputClass} /></label>
}
