'use client'

import { useEffect, useState } from 'react'
import type { FileServiceJob } from '@/types/autokeys'
import CustomSelect from '@/components/ak/CustomSelect'

type Props = {
  open: boolean
  job?: FileServiceJob | null
  onClose: () => void
  onSubmit: (payload: Partial<FileServiceJob>) => Promise<void>
}

const emptyForm: Partial<FileServiceJob> = {
  taller: '',
  marca: '',
  modelo: '',
  motor: '',
  matricula: '',
  ecu: '',
  hw: '',
  sw: '',
  servicio: 'Stage 1',
  estado: 'pendiente',
  precio: 0,
  pagado: false,
  notas: '',
}

export default function FileServiceModal({ open, job, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<FileServiceJob>>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(job || emptyForm)
  }, [job, open])

  if (!open) return null

  function setField(field: keyof FileServiceJob, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0B1220] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-400 font-black">File Service</p>
            <h2 className="text-2xl font-black mt-1">{job ? 'Editar solicitud' : 'Nueva solicitud'}</h2>
            <p className="text-zinc-500 text-sm mt-1">Gestiona trabajos de distribuidores y talleres externos.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-2 text-zinc-300 hover:bg-white/5">Cerrar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Taller / Distribuidor" value={form.taller} onChange={(v) => setField('taller', v)} required />
          <Input label="Marca" value={form.marca} onChange={(v) => setField('marca', v)} />
          <Input label="Modelo" value={form.modelo} onChange={(v) => setField('modelo', v)} />
          <Input label="Motor" value={form.motor} onChange={(v) => setField('motor', v)} />
          <Input label="Matrícula" value={form.matricula} onChange={(v) => setField('matricula', v)} />
          <Input label="ECU" value={form.ecu} onChange={(v) => setField('ecu', v)} />
          <Input label="HW" value={form.hw} onChange={(v) => setField('hw', v)} />
          <Input label="SW" value={form.sw} onChange={(v) => setField('sw', v)} />
          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Servicio</span>
            <CustomSelect
              value={form.servicio || 'Stage 1'}
              onChange={(v) => setField('servicio', v)}
              options={[
                'Stage 1', 'Stage 2', 'DPF OFF', 'EGR OFF', 'AdBlue / SCR OFF',
                'IMMO OFF', 'Clonación', 'Hardcut', 'Pops & Bangs', 'Otro',
              ].map((s) => ({ value: s, label: s }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Estado</span>
            <CustomSelect
              value={form.estado || 'pendiente'}
              onChange={(v) => setField('estado', v)}
              options={[
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'en_proceso', label: 'En proceso' },
                { value: 'enviado', label: 'Enviado' },
                { value: 'revision', label: 'Revisión' },
                { value: 'finalizado', label: 'Finalizado' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
          </label>
          <Input label="Precio" type="number" value={form.precio ?? 0} onChange={(v) => setField('precio', Number(v))} />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 mt-7">
            <input type="checkbox" checked={Boolean(form.pagado)} onChange={(e) => setField('pagado', e.target.checked)} />
            <span className="font-bold text-zinc-300">Pagado</span>
          </label>
        </div>

        <label className="block space-y-2 mt-4">
          <span className="text-sm font-bold text-zinc-300">Notas</span>
          <textarea value={form.notas || ''} onChange={(e) => setField('notas', e.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 outline-none focus:border-red-500" placeholder="Observaciones del archivo, peticiones del taller, avisos..." />
        </label>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-5 py-3 font-bold hover:bg-white/5">Cancelar</button>
          <button disabled={saving} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false }: any) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-zinc-300">{label}</span>
      <input required={required} type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 outline-none focus:border-red-500" />
    </label>
  )
}
