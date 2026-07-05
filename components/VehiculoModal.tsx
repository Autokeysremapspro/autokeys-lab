'use client'

import { useEffect, useState } from 'react'

type Cliente = {
  id: string
  nombre: string
  telefono?: string | null
}

type VehiculoLike = {
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
  clientes?: Cliente[]
  initialData?: VehiculoLike | null
  vehiculo?: VehiculoLike | null
  loading?: boolean
  title?: string
  onClose: () => void
  onSubmit?: (payload: Partial<VehiculoLike>) => Promise<void>
  onSave?: (payload: Partial<VehiculoLike>) => Promise<void>
}

const emptyForm: Partial<VehiculoLike> = {
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
  initialData,
  vehiculo,
  loading = false,
  title,
  onClose,
  onSubmit,
  onSave,
}: Props) {
  const activeData = initialData || vehiculo || null
  const [form, setForm] = useState<Partial<VehiculoLike>>(emptyForm)
  const [internalLoading, setInternalLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ ...emptyForm, ...(activeData || {}) })
  }, [open, activeData?.id])

  if (!open) return null

  const isSaving = loading || internalLoading
  const heading = title || (activeData ? 'Editar vehículo' : 'Nuevo vehículo')

  function setField(key: keyof VehiculoLike, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: key === 'anio' ? (value ? Number(value) : null) : value,
    }))
  }

  async function submit() {
    if (!form.marca?.trim() && !form.matricula?.trim()) {
      alert('Introduce al menos marca o matrícula')
      return
    }

    const payload: Partial<VehiculoLike> = {
      cliente_id: form.cliente_id || null,
      marca: form.marca?.trim() || null,
      modelo: form.modelo?.trim() || null,
      motor: form.motor?.trim() || null,
      anio: form.anio ? Number(form.anio) : null,
      matricula: form.matricula?.trim().toUpperCase() || null,
      bastidor: form.bastidor?.trim().toUpperCase() || null,
      ecu: form.ecu?.trim() || null,
      hardware: form.hardware?.trim() || null,
      software: form.software?.trim() || null,
      notas: form.notas?.trim() || null,
    }

    const handler = onSubmit || onSave
    if (!handler) return

    setInternalLoading(true)
    try {
      await handler(payload)
    } catch (error: any) {
      alert(error?.message || 'No se pudo guardar el vehículo')
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{heading}</h2>
            <p className="text-sm text-slate-400">Ficha base del vehículo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-3">
            <span className="mb-2 block text-sm font-bold text-slate-300">Cliente</span>
            <select
              value={form.cliente_id || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cliente_id: e.target.value || null }))
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
            >
              <option value="">Sin asignar</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.telefono ? `- ${cliente.telefono}` : ''}
                </option>
              ))}
            </select>
          </label>

          <Field label="Marca" value={form.marca || ''} onChange={(v) => setField('marca', v)} />
          <Field label="Modelo" value={form.modelo || ''} onChange={(v) => setField('modelo', v)} />
          <Field label="Motor" value={form.motor || ''} onChange={(v) => setField('motor', v)} />
          <Field label="Matrícula" value={form.matricula || ''} onChange={(v) => setField('matricula', v.toUpperCase())} />
          <Field label="Bastidor / VIN" value={form.bastidor || ''} onChange={(v) => setField('bastidor', v.toUpperCase())} />
          <Field label="Año" value={form.anio ? String(form.anio) : ''} onChange={(v) => setField('anio', v)} />
          <Field label="ECU" value={form.ecu || ''} onChange={(v) => setField('ecu', v)} />
          <Field label="Hardware" value={form.hardware || ''} onChange={(v) => setField('hardware', v)} />
          <Field label="Software" value={form.software || ''} onChange={(v) => setField('software', v)} />

          <label className="block md:col-span-3">
            <span className="mb-2 block text-sm font-bold text-slate-300">Notas</span>
            <textarea
              value={form.notas || ''}
              onChange={(e) => setField('notas', e.target.value)}
              className="h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60"
          >
            {isSaving ? 'Guardando...' : 'Guardar vehículo'}
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
      />
    </label>
  )
}
