'use client'

import { useEffect, useState } from 'react'
import type { Cliente, Vehiculo } from '@/types/autokeys'
import { ClienteService } from '@/lib/services/clientes'

type Props = {
  open: boolean
  vehiculo?: Vehiculo | null
  onClose: () => void
  onSave: (payload: Partial<Vehiculo>) => Promise<void>
}

export default function VehiculoModal({ open, vehiculo, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Vehiculo>>({})
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(vehiculo || { marca: '', modelo: '', motor: '', matricula: '', bastidor: '', ecu: '', hardware: '', software: '', notas: '' })
    ClienteService.getAll().then(setClientes).catch(console.error)
  }, [open, vehiculo])

  if (!open) return null
  const set = (key: keyof Vehiculo, value: string) => setForm(prev => ({ ...prev, [key]: key === 'anio' ? Number(value) || null : value }))

  async function submit() {
    if (!form.marca?.trim() && !form.matricula?.trim()) {
      alert('Introduce al menos marca o matrícula')
      return
    }
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (e: any) {
      alert(e?.message || 'No se pudo guardar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{vehiculo ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
            <p className="text-sm text-slate-400">Ficha base del vehículo.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Cerrar</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-3">
            <span className="mb-2 block text-sm font-bold text-slate-300">Cliente</span>
            <select value={form.cliente_id || ''} onChange={e => setForm(prev => ({ ...prev, cliente_id: e.target.value || null }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500">
              <option value="">Sin asignar</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `- ${c.telefono}` : ''}</option>)}
            </select>
          </label>
          <Field label="Marca" value={form.marca || ''} onChange={v => set('marca', v)} />
          <Field label="Modelo" value={form.modelo || ''} onChange={v => set('modelo', v)} />
          <Field label="Motor" value={form.motor || ''} onChange={v => set('motor', v)} />
          <Field label="Matrícula" value={form.matricula || ''} onChange={v => set('matricula', v.toUpperCase())} />
          <Field label="Bastidor / VIN" value={form.bastidor || ''} onChange={v => set('bastidor', v.toUpperCase())} />
          <Field label="Año" value={form.anio ? String(form.anio) : ''} onChange={v => set('anio', v)} />
          <Field label="ECU" value={form.ecu || ''} onChange={v => set('ecu', v)} />
          <Field label="Hardware" value={form.hardware || ''} onChange={v => set('hardware', v)} />
          <Field label="Software" value={form.software || ''} onChange={v => set('software', v)} />
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-300">Notas</label>
            <textarea value={form.notas || ''} onChange={e => set('notas', e.target.value)} className="h-28 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-800">Cancelar</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500 disabled:opacity-60">
            {loading ? 'Guardando...' : 'Guardar vehículo'}
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
