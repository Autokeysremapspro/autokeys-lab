'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CasoTecnico } from '@/types/autokeys'

const empty: Partial<CasoTecnico> = {
  titulo: '',
  categoria: 'averia',
  marca: '',
  modelo: '',
  motor: '',
  matricula: '',
  bastidor: '',
  ecu: '',
  hw: '',
  sw: '',
  dtc: '',
  sintomas: '',
  diagnostico: '',
  solucion: '',
  herramientas: '',
  archivos_resumen: '',
  tiempo_estimado: null,
  tiempo_real: null,
  tags: [],
  publico: false,
  destacado: false,
}

const categorias = ['averia', 'clonacion_ecu', 'immo', 'llaves', 'reprogramacion', 'cuadro', 'airbag', 'bsi_bcm', 'fem_bdc', 'egr_dpf_adblue', 'otro']

export default function CasoTecnicoModal({
  open,
  caso,
  onClose,
  onSubmit,
}: {
  open: boolean
  caso?: CasoTecnico | null
  onClose: () => void
  onSubmit: (payload: Partial<CasoTecnico>) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<CasoTecnico>>(empty)
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const data = caso || empty
    setForm(data)
    setTagsText((data.tags || []).join(', '))
    setError('')
  }, [open, caso])

  const title = useMemo(() => caso?.id ? 'Editar caso técnico' : 'Nuevo caso técnico', [caso?.id])

  if (!open) return null

  function set<K extends keyof CasoTecnico>(key: K, value: CasoTecnico[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!form.titulo?.trim()) throw new Error('El título es obligatorio')
      await onSubmit({
        ...form,
        tags: tagsText.split(',').map(t => t.trim()).filter(Boolean),
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el caso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#111827] shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="text-zinc-500 mt-1">Guarda síntomas, diagnóstico, solución y datos técnicos para reutilizar el conocimiento.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-4 py-2 font-bold hover:bg-white/5">Cerrar</button>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 mb-4">{error}</div>}

        <div className="grid md:grid-cols-3 gap-4">
          <Field className="md:col-span-2" label="Título *" value={form.titulo || ''} onChange={v => set('titulo', v as any)} placeholder="Ej: Opel Combo MD1CS003 no arranca tras campaña" />
          <label className="space-y-2">
            <span className="text-xs font-black uppercase text-zinc-400">Categoría</span>
            <select value={form.categoria || 'averia'} onChange={e => set('categoria', e.target.value as any)}>
              {categorias.map(c => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}
            </select>
          </label>

          <Field label="Marca" value={form.marca || ''} onChange={v => set('marca', v as any)} placeholder="BMW, Opel, Audi..." />
          <Field label="Modelo" value={form.modelo || ''} onChange={v => set('modelo', v as any)} />
          <Field label="Motor" value={form.motor || ''} onChange={v => set('motor', v as any)} />
          <Field label="Matrícula" value={form.matricula || ''} onChange={v => set('matricula', v as any)} />
          <Field label="VIN / Bastidor" value={form.bastidor || ''} onChange={v => set('bastidor', v as any)} />
          <Field label="ECU" value={form.ecu || ''} onChange={v => set('ecu', v as any)} placeholder="MD1CS003, EDC17C50..." />
          <Field label="HW" value={form.hw || ''} onChange={v => set('hw', v as any)} />
          <Field label="SW" value={form.sw || ''} onChange={v => set('sw', v as any)} />
          <Field label="DTC" value={form.dtc || ''} onChange={v => set('dtc', v as any)} placeholder="Pxxxx, Uxxxx..." />

          <Field textarea className="md:col-span-3" label="Síntomas" value={form.sintomas || ''} onChange={v => set('sintomas', v as any)} placeholder="Qué le pasa al vehículo o unidad..." />
          <Field textarea className="md:col-span-3" label="Diagnóstico" value={form.diagnostico || ''} onChange={v => set('diagnostico', v as any)} placeholder="Pruebas realizadas, datos observados, causa probable..." />
          <Field textarea className="md:col-span-3" label="Solución aplicada" value={form.solucion || ''} onChange={v => set('solucion', v as any)} placeholder="Qué se hizo para resolverlo..." />
          <Field textarea className="md:col-span-2" label="Herramientas utilizadas" value={form.herramientas || ''} onChange={v => set('herramientas', v as any)} placeholder="Flex, Kess V3, Autel, WinOLS..." />
          <Field textarea label="Archivos / backups" value={form.archivos_resumen || ''} onChange={v => set('archivos_resumen', v as any)} placeholder="ORI, MOD, EEPROM, full backup..." />
          <Field label="Tiempo estimado (min)" type="number" value={String(form.tiempo_estimado || '')} onChange={v => set('tiempo_estimado', Number(v) as any)} />
          <Field label="Tiempo real (min)" type="number" value={String(form.tiempo_real || '')} onChange={v => set('tiempo_real', Number(v) as any)} />
          <Field label="Tags" value={tagsText} onChange={setTagsText} placeholder="MD1, no arranca, campaña, immo..." />
        </div>

        <div className="flex flex-wrap gap-4 mt-5">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 bg-black/20">
            <input type="checkbox" checked={!!form.destacado} onChange={e => set('destacado', e.target.checked as any)} />
            <span className="font-bold">Destacado</span>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 bg-black/20">
            <input type="checkbox" checked={!!form.publico} onChange={e => set('publico', e.target.checked as any)} />
            <span className="font-bold">Visible para equipo</span>
          </label>
        </div>

        <button disabled={saving} className="w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-500 mt-6">
          {saving ? 'Guardando...' : 'Guardar caso técnico'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea, type = 'text', className = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean; type?: string; className?: string }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-xs font-black uppercase text-zinc-400">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  )
}
