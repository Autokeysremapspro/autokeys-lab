'use client'

import { useEffect, useState } from 'react'
import type { Cliente } from '@/types/autokeys'

type Props = {
  open: boolean
  cliente?: Cliente | null
  onClose: () => void
  onSave: (payload: Partial<Cliente>) => Promise<void>
}

export default function ClienteModal({ open, cliente, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Cliente>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setForm(cliente || { nombre: '', telefono: '', email: '', nif: '', direccion: '', codigo_postal: '', poblacion: '', provincia: '', notas: '' })
  }, [open, cliente])

  if (!open) return null

  const set = (key: keyof Cliente, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  async function submit() {
    if (!form.nombre?.trim()) {
      alert('El nombre es obligatorio')
      return
    }
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (e: any) {
      alert(e?.message || 'No se pudo guardar el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <p className="text-sm text-slate-400">Datos administrativos del cliente.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Cerrar</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre *" value={form.nombre || ''} onChange={v => set('nombre', v)} />
          <Field label="Teléfono" value={form.telefono || ''} onChange={v => set('telefono', v)} />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} />
          <Field label="NIF / CIF" value={form.nif || ''} onChange={v => set('nif', v)} />
          <div className="md:col-span-2"><Field label="Dirección" value={form.direccion || ''} onChange={v => set('direccion', v)} /></div>
          <Field label="Código postal" value={form.codigo_postal || ''} onChange={v => set('codigo_postal', v)} />
          <Field label="Población" value={form.poblacion || ''} onChange={v => set('poblacion', v)} />
          <Field label="Provincia" value={form.provincia || ''} onChange={v => set('provincia', v)} />
          <div />
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-300">Observaciones</label>
            <textarea value={form.notas || ''} onChange={e => set('notas', e.target.value)} className="h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-800">Cancelar</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60">
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500" />
    </label>
  )
}
