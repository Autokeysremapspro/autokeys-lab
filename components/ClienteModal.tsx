'use client'

import { FormEvent, useEffect, useState } from 'react'

type ClienteForm = {
  nombre: string
  telefono: string
  email: string
  nif: string
  direccion: string
  codigo_postal: string
  poblacion: string
  provincia: string
  notas: string
}

const emptyForm: ClienteForm = {
  nombre: '',
  telefono: '',
  email: '',
  nif: '',
  direccion: '',
  codigo_postal: '',
  poblacion: '',
  provincia: '',
  notas: ''
}

export default function ClienteModal({
  open,
  title,
  initialData,
  loading,
  onClose,
  onSubmit
}: {
  open: boolean
  title: string
  initialData?: Partial<ClienteForm>
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: ClienteForm) => Promise<void> | void
}) {
  const [form, setForm] = useState<ClienteForm>(emptyForm)

  useEffect(() => {
    if (open) setForm({ ...emptyForm, ...(initialData || {}) })
  }, [open, initialData])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit(form)
  }

  function update(key: keyof ClienteForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-4xl p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">Datos administrativos del cliente.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-dark">Cerrar</button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Nombre *</span>
            <input required value={form.nombre} onChange={e => update('nombre', e.target.value)} placeholder="Nombre o razón social" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Teléfono</span>
            <input value={form.telefono} onChange={e => update('telefono', e.target.value)} placeholder="600 000 000" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Email</span>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="cliente@email.com" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">NIF / CIF</span>
            <input value={form.nif} onChange={e => update('nif', e.target.value)} placeholder="00000000A" className="w-full" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Dirección</span>
            <input value={form.direccion} onChange={e => update('direccion', e.target.value)} placeholder="Calle, número, local..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Código postal</span>
            <input value={form.codigo_postal} onChange={e => update('codigo_postal', e.target.value)} placeholder="23350" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Población</span>
            <input value={form.poblacion} onChange={e => update('poblacion', e.target.value)} placeholder="Puente de Génave" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Provincia</span>
            <input value={form.provincia} onChange={e => update('provincia', e.target.value)} placeholder="Jaén" className="w-full" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Observaciones</span>
            <textarea value={form.notas} onChange={e => update('notas', e.target.value)} placeholder="Notas internas, preferencias, avisos..." className="min-h-[110px] w-full" />
          </label>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" onClick={onClose} className="btn btn-dark">Cancelar</button>
            <button disabled={loading} className="btn btn-red disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
