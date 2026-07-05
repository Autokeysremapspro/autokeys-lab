'use client'

import { useEffect, useState } from 'react'

export type ClienteOption = {
  id: string
  nombre: string
  telefono?: string | null
}

export type VehiculoModalData = {
  id?: string
  cliente_id?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  anio?: number | null
  matricula?: string | null
  bastidor?: string | null
  ecu?: string | null
  hardware?: string | null
  software?: string | null
  notas?: string | null
}

type Props = {
  open: boolean
  clientes?: ClienteOption[]
  initialData?: VehiculoModalData | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: VehiculoModalData) => Promise<void>
}

const emptyForm: VehiculoModalData = {
  cliente_id: null,
  marca: '',
  modelo: '',
  motor: '',
  anio: null,
  matricula: '',
  bastidor: '',
  ecu: '',
  hardware: '',
  software: '',
  notas: '',
}

export default function VehiculoModal({
  open,
  clientes = [],
  initialData = null,
  loading = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<VehiculoModalData>(emptyForm)

  useEffect(() => {
    if (!open) return

    setForm({
      ...emptyForm,
      ...(initialData || {}),
      cliente_id: initialData?.cliente_id || null,
      marca: initialData?.marca || '',
      modelo: initialData?.modelo || '',
      motor: initialData?.motor || '',
      anio: initialData?.anio || null,
      matricula: initialData?.matricula || '',
      bastidor: initialData?.bastidor || '',
      ecu: initialData?.ecu || '',
      hardware: initialData?.hardware || '',
      software: initialData?.software || '',
      notas: initialData?.notas || '',
    })
  }, [open, initialData])

  if (!open) return null

  function setValue(key: keyof VehiculoModalData, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: key === 'anio' ? (value ? Number(value) : null) : value,
    }))
  }

  async function handleSubmit() {
    if (!form.marca?.trim() && !form.matricula?.trim()) {
      alert('Introduce al menos marca o matrícula')
      return
    }

    await onSubmit({
      ...form,
      cliente_id: form.cliente_id || null,
      marca: form.marca?.trim() || null,
      modelo: form.modelo?.trim() || null,
      motor: form.motor?.trim() || null,
      anio: form.anio || null,
      matricula: form.matricula?.trim().toUpperCase() || null,
      bastidor: form.bastidor?.trim().toUpperCase() || null,
      ecu: form.ecu?.trim() || null,
      hardware: form.hardware?.trim() || null,
      software: form.software?.trim() || null,
      notas: form.notas?.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-400">
              Vehículo
            </div>
            <h2 className="text-2xl font-black text-white">
              {initialData?.id ? 'Editar vehículo' : 'Nuevo vehículo'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Datos base para vincular clientes, expedientes, facturas y futuras intervenciones.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-3">
            <span className="mb-2 block text-sm font-bold text-slate-300">Cliente</span>
            <select
              value={form.cliente_id || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, cliente_id: e.target.value || null }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
            >
              <option value="">Sin asignar</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.telefono ? `- ${cliente.telefono}` : ''}
                </option>
              ))}
            </select>
          </label>

          <Field label="Marca" value={form.marca || ''} onChange={(v) => setValue('marca', v)} />
          <Field label="Modelo" value={form.modelo || ''} onChange={(v) => setValue('modelo', v)} />
          <Field label="Motor" value={form.motor || ''} onChange={(v) => setValue('motor', v)} />
          <Field label="Matrícula" value={form.matricula || ''} onChange={(v) => setValue('matricula', v.toUpperCase())} />
          <Field label="Bastidor / VIN" value={form.bastidor || ''} onChange={(v) => setValue('bastidor', v.toUpperCase())} />
          <Field label="Año" value={form.anio ? String(form.anio) : ''} onChange={(v) => setValue('anio', v)} type="number" />
          <Field label="ECU" value={form.ecu || ''} onChange={(v) => setValue('ecu', v)} />
          <Field label="Hardware" value={form.hardware || ''} onChange={(v) => setValue('hardware', v)} />
          <Field label="Software" value={form.software || ''} onChange={(v) => setValue('software', v)} />

          <label className="block md:col-span-3">
            <span className="mb-2 block text-sm font-bold text-slate-300">Notas</span>
            <textarea
              value={form.notas || ''}
              onChange={(e) => setValue('notas', e.target.value)}
              className="h-28 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Observaciones internas del vehículo..."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-500"
      />
    </label>
  )
}
