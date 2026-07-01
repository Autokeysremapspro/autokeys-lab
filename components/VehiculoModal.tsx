'use client'

import { FormEvent, useEffect, useState } from 'react'

type ClienteOption = {
  id: string
  nombre: string
  telefono?: string | null
}

type VehiculoForm = {
  cliente_id: string
  marca: string
  modelo: string
  motor: string
  anio: string
  matricula: string
  bastidor: string
  ecu: string
  hardware: string
  software: string
  notas: string
}

const emptyForm: VehiculoForm = {
  cliente_id: '',
  marca: '',
  modelo: '',
  motor: '',
  anio: '',
  matricula: '',
  bastidor: '',
  ecu: '',
  hardware: '',
  software: '',
  notas: ''
}

export default function VehiculoModal({
  open,
  title,
  clientes,
  initialData,
  loading,
  onClose,
  onSubmit
}: {
  open: boolean
  title: string
  clientes: ClienteOption[]
  initialData?: Partial<any>
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: VehiculoForm) => Promise<void> | void
}) {
  const [form, setForm] = useState<VehiculoForm>(emptyForm)

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        ...(initialData || {}),
        cliente_id: initialData?.cliente_id || '',
        anio: initialData?.anio ? String(initialData.anio) : '',
        marca: initialData?.marca || '',
        modelo: initialData?.modelo || '',
        motor: initialData?.motor || '',
        matricula: initialData?.matricula || '',
        bastidor: initialData?.bastidor || '',
        ecu: initialData?.ecu || '',
        hardware: initialData?.hardware || '',
        software: initialData?.software || '',
        notas: initialData?.notas || ''
      })
    }
  }, [open, initialData])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit(form)
  }

  function update(key: keyof VehiculoForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="card max-h-[92vh] w-full max-w-5xl overflow-auto p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">Datos técnicos y administrativos del vehículo.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-dark">Cerrar</button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Cliente *</span>
            <select required value={form.cliente_id} onChange={e => update('cliente_id', e.target.value)} className="w-full">
              <option value="">Seleccionar cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}{cliente.telefono ? ` · ${cliente.telefono}` : ''}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Marca *</span>
            <input required value={form.marca} onChange={e => update('marca', e.target.value)} placeholder="BMW, Audi, Mercedes..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Modelo *</span>
            <input required value={form.modelo} onChange={e => update('modelo', e.target.value)} placeholder="320d, A4, Clase C..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Matrícula</span>
            <input value={form.matricula} onChange={e => update('matricula', e.target.value.toUpperCase())} placeholder="1234ABC" className="w-full uppercase" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Bastidor / VIN</span>
            <input value={form.bastidor} onChange={e => update('bastidor', e.target.value.toUpperCase())} placeholder="WBAXXXXXXXXXXXXX" className="w-full uppercase" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Motor</span>
            <input value={form.motor} onChange={e => update('motor', e.target.value)} placeholder="N47, M57, CDNC, DV6..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Año</span>
            <input type="number" min="1950" max="2050" value={form.anio} onChange={e => update('anio', e.target.value)} placeholder="2018" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">ECU</span>
            <input value={form.ecu} onChange={e => update('ecu', e.target.value)} placeholder="EDC17C50, MD1CS003, SID807..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Hardware</span>
            <input value={form.hardware} onChange={e => update('hardware', e.target.value)} placeholder="HW / Bosch / Siemens..." className="w-full" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Software</span>
            <input value={form.software} onChange={e => update('software', e.target.value)} placeholder="SW, calibración, versión..." className="w-full" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Observaciones</span>
            <textarea value={form.notas} onChange={e => update('notas', e.target.value)} placeholder="Averías conocidas, equipamiento, modificaciones, notas internas..." className="min-h-[110px] w-full" />
          </label>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" onClick={onClose} className="btn btn-dark">Cancelar</button>
            <button disabled={loading} className="btn btn-red disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
