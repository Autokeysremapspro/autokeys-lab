'use client'

import { useEffect, useState } from 'react'
import type { BibliotecaPayload, BibliotecaTecnica } from '@/types/biblioteca'

const initial: BibliotecaPayload = {
  titulo: '',
  marca: '',
  modelo: '',
  motor: '',
  ecu: '',
  hardware: '',
  software: '',
  tipo_trabajo: '',
  herramienta: '',
  dificultad: 1,
  tiempo_minutos: 0,
  sintomas: '',
  solucion: '',
  notas: '',
  tags: [],
  destacado: false,
  solucion_definitiva: false,
}

type Props = {
  open: boolean
  caso?: BibliotecaTecnica | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: BibliotecaPayload) => Promise<void>
}

export default function BibliotecaCasoModal({ open, caso, loading, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<BibliotecaPayload>(initial)
  const [tagsText, setTagsText] = useState('')

  useEffect(() => {
    if (!open) return
    if (caso) {
      setForm({ ...caso })
      setTagsText((caso.tags || []).join(', '))
    } else {
      setForm(initial)
      setTagsText('')
    }
  }, [open, caso])

  if (!open) return null

  function set(key: keyof BibliotecaPayload, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit() {
    await onSubmit({
      ...form,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{caso ? 'Editar caso técnico' : 'Nuevo caso técnico'}</h2>
            <p className="text-sm text-zinc-500">Guarda soluciones, síntomas, ECU, HW/SW y notas del laboratorio.</p>
          </div>
          <button onClick={onClose} className="btn btn-dark">Cerrar</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Título" value={form.titulo || ''} onChange={(v) => set('titulo', v)} className="md:col-span-3" />
          <Field label="Marca" value={form.marca || ''} onChange={(v) => set('marca', v)} />
          <Field label="Modelo" value={form.modelo || ''} onChange={(v) => set('modelo', v)} />
          <Field label="Motor" value={form.motor || ''} onChange={(v) => set('motor', v)} />
          <Field label="ECU" value={form.ecu || ''} onChange={(v) => set('ecu', v)} />
          <Field label="HW" value={form.hardware || ''} onChange={(v) => set('hardware', v)} />
          <Field label="SW" value={form.software || ''} onChange={(v) => set('software', v)} />
          <Field label="Tipo trabajo" value={form.tipo_trabajo || ''} onChange={(v) => set('tipo_trabajo', v)} />
          <Field label="Herramienta" value={form.herramienta || ''} onChange={(v) => set('herramienta', v)} />
          <Field label="Tiempo minutos" value={String(form.tiempo_minutos || 0)} onChange={(v) => set('tiempo_minutos', Number(v) || 0)} />
          <Field label="Dificultad 1-5" value={String(form.dificultad || 1)} onChange={(v) => set('dificultad', Math.min(5, Math.max(1, Number(v) || 1)))} />
          <Field label="Tags separados por coma" value={tagsText} onChange={setTagsText} className="md:col-span-2" />

          <Area label="Síntomas" value={form.sintomas || ''} onChange={(v) => set('sintomas', v)} />
          <Area label="Solución aplicada" value={form.solucion || ''} onChange={(v) => set('solucion', v)} />
          <Area label="Notas internas" value={form.notas || ''} onChange={(v) => set('notas', v)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-bold text-zinc-200">
            <input type="checkbox" checked={!!form.destacado} onChange={(e) => set('destacado', e.target.checked)} className="h-5 w-5 accent-red-600" />
            Caso frecuente
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-bold text-zinc-200">
            <input type="checkbox" checked={!!form.solucion_definitiva} onChange={(e) => set('solucion_definitiva', e.target.checked)} className="h-5 w-5 accent-red-600" />
            Solución definitiva
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-dark">Cancelar</button>
          <button onClick={submit} disabled={loading} className="btn btn-red disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar caso'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-zinc-300">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-red-500" />
    </label>
  )
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="md:col-span-3">
      <span className="mb-2 block text-sm font-bold text-zinc-300">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-red-500" />
    </label>
  )
}
