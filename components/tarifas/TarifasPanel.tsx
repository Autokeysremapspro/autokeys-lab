'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ChevronDown, Clipboard, Cpu, FileCode2, KeyRound, Loader2, Pencil,
  Plus, RotateCcw, Search, Settings2, ShieldCheck, Store, Wrench, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import LabShell from '@/components/lab/LabShell'
import type { TarifaCategoria, TarifaForm, TarifaServicio } from '@/types/tarifas'

const categoryConfig: Record<TarifaCategoria, { label: string; short: string; icon: typeof KeyRound; accent: string; help: string }> = {
  llaves: { label: 'Llaves', short: 'Llaves', icon: KeyRound, accent: 'text-sky-300 bg-sky-400/10 border-sky-400/20', help: 'Marca, modelo, transponder y espadín' },
  ecus: { label: 'ECUs', short: 'ECUs', icon: Cpu, accent: 'text-violet-300 bg-violet-400/10 border-violet-400/20', help: 'Diagnosis, clonación, reparación y Stage 1' },
  reparaciones: { label: 'Reparaciones', short: 'Reparaciones', icon: Wrench, accent: 'text-amber-300 bg-amber-400/10 border-amber-400/20', help: 'Módulos, averías y plazos' },
  talleres: { label: 'Tarifa talleres', short: 'Talleres', icon: Store, accent: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', help: 'Servicios para colaboradores' },
  files: { label: 'Files / archivos', short: 'Files', icon: FileCode2, accent: 'text-rose-300 bg-rose-400/10 border-rose-400/20', help: 'Calibraciones y soluciones de archivo' },
}

const categories = Object.keys(categoryConfig) as TarifaCategoria[]
const PAGE_SIZE = 36

const emptyForm: TarifaForm = {
  categoria: 'llaves', familia: null, marca: null, modelo: null, anios: null, motor: null,
  sistema: null, ecu: null, combustible: null, acceso: null, transponder: null, espadin: null,
  situacion: null, servicio: '', descripcion: null, pvp: 0, precio_minimo: null,
  pvp_desde: null, pvp_hasta: null, precio_taller_desde: null, precio_taller: null,
  precio_taller_hasta: null, regla_precio: null, incluye: null, condiciones: null, plazo: null,
  requiere_laboratorio: false, activo: true,
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function euro(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function unique(rows: TarifaServicio[], field: keyof TarifaServicio) {
  return Array.from(new Set(rows.map((row) => String(row[field] || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'))
}

function descriptiveFields(row: TarifaServicio) {
  const fields: Array<[string, string | null]> = []
  if (row.marca) fields.push([row.categoria === 'reparaciones' ? 'Vehículo' : 'Marca', row.marca])
  if (row.modelo) fields.push(['Modelo', row.modelo])
  if (row.anios) fields.push(['Años', row.anios])
  if (row.motor) fields.push(['Motor', row.motor])
  if (row.ecu) fields.push(['ECU', row.ecu])
  if (row.sistema) fields.push([row.categoria === 'reparaciones' ? 'Módulo' : 'Sistema', row.sistema])
  if (row.transponder) fields.push(['Transponder', row.transponder])
  if (row.espadin) fields.push(['Espadín', row.espadin])
  if (row.acceso) fields.push(['Acceso', row.acceso])
  if (row.situacion) fields.push([row.categoria === 'files' ? 'Complejidad' : 'Situación', row.situacion])
  if (row.familia) fields.push(['Familia', row.familia])
  if (row.plazo) fields.push(['Plazo', row.plazo])
  return fields.slice(0, 6)
}

function customerPrices(row: TarifaServicio, customer: 'particular' | 'taller') {
  if (customer === 'taller' && row.precio_taller !== null) {
    return {
      from: row.precio_taller_desde ?? row.precio_taller,
      recommended: row.precio_taller,
      to: row.precio_taller_hasta ?? row.precio_taller,
    }
  }
  return { from: row.pvp_desde ?? row.pvp, recommended: row.pvp, to: row.pvp_hasta ?? row.pvp }
}

function buildWhatsapp(row: TarifaServicio, customer: 'particular' | 'taller') {
  const price = customer === 'taller' && row.precio_taller !== null ? row.precio_taller : row.pvp
  const subject = [row.marca, row.modelo, row.servicio].filter(Boolean).join(' · ')
  return `Hola, para ${subject} el precio es de ${euro(price)} IVA incluido.${row.incluye ? ` Incluye: ${row.incluye}.` : ''}${row.condiciones ? ` Condiciones: ${row.condiciones}.` : ''} Precio sujeto a confirmar los datos del vehículo o módulo.`
}

function ServiceCard({ row, customer, canEdit, onEdit }: { row: TarifaServicio; customer: 'particular' | 'taller'; canEdit: boolean; onEdit: (row: TarifaServicio) => void }) {
  const config = categoryConfig[row.categoria]
  const Icon = config.icon
  const prices = customerPrices(row, customer)

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(buildWhatsapp(row, customer))
      toast.success('Respuesta copiada para WhatsApp')
    } catch {
      toast.error('No se pudo copiar la respuesta')
    }
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-4 shadow-xl shadow-black/10 transition hover:border-white/[0.16]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${config.accent}`}><Icon size={19} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">{config.short} · {row.codigo}</p>
            <h2 className="mt-1 text-[15px] font-bold leading-5 text-white">{row.servicio}</h2>
            {(row.marca || row.modelo) ? <p className="mt-1 text-xs text-zinc-400">{[row.marca, row.modelo].filter(Boolean).join(' · ')}</p> : null}
          </div>
        </div>
        {canEdit ? <button type="button" onClick={() => onEdit(row)} aria-label={`Editar ${row.servicio}`} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Pencil size={14} /></button> : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/[0.06] pt-3">
        {descriptiveFields(row).map(([label, value]) => (
          <div key={`${label}-${value}`} className="min-w-0">
            <dt className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</dt>
            <dd className="mt-0.5 break-words text-[11px] leading-4 text-zinc-300">{value}</dd>
          </div>
        ))}
      </dl>

      {row.incluye ? <p className="mt-3 text-[11px] leading-4 text-zinc-500"><span className="font-bold text-zinc-400">Incluye:</span> {row.incluye}</p> : null}
      {row.condiciones ? <p className="mt-2 text-[11px] leading-4 text-zinc-600">{row.condiciones}</p> : null}

      {row.requiere_laboratorio ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[11px] leading-4 text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Confirmar con laboratorio antes de dar precio definitivo.
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="border-t border-white/[0.06] pt-3">
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.07] bg-black/20 p-2">
            <div className="px-1 py-1"><p className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Desde</p><p className="mt-1 text-sm font-black text-zinc-300">{euro(prices.from)}</p><p className="mt-0.5 text-[9px] text-zinc-700">Caso sencillo</p></div>
            <div className="rounded-lg border border-[#c81f2a]/30 bg-[#c81f2a]/10 px-2 py-1"><p className="text-[9px] font-black uppercase tracking-wider text-[#ff7887]">Recomendado</p><p className="mt-1 text-lg font-black text-white">{euro(prices.recommended)}</p><p className="mt-0.5 text-[9px] text-zinc-500">Usar por defecto</p></div>
            <div className="px-1 py-1 text-right"><p className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Hasta</p><p className="mt-1 text-sm font-black text-zinc-300">{euro(prices.to)}</p><p className="mt-0.5 text-[9px] text-zinc-700">Complejo / urgente</p></div>
          </div>
          {row.regla_precio ? <p className="mt-2 rounded-lg bg-white/[0.025] px-2.5 py-2 text-[10px] leading-4 text-zinc-500"><span className="font-bold text-zinc-400">Qué cobrar:</span> {row.regla_precio}</p> : null}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[10px] text-zinc-600">IVA incluido · piezas aparte si se indica</p>
            <button type="button" onClick={copyAnswer} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.08] hover:text-white"><Clipboard size={14} /> Copiar recomendado</button>
          </div>
        </div>
      </div>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-zinc-400"><span className="mb-1.5 block">{label}</span>{children}</label>
}

function EditModal({ initial, onClose, onSaved }: { initial: TarifaServicio | null; onClose: () => void; onSaved: (row: TarifaServicio) => void }) {
  const [form, setForm] = useState<TarifaForm>(() => initial ? { ...initial } : { ...emptyForm })
  const [saving, setSaving] = useState(false)
  const isNew = !initial
  const set = (field: keyof TarifaForm, value: string | number | boolean | null) => setForm((current) => ({ ...current, [field]: value }))
  const inputClass = 'w-full rounded-xl border border-white/10 bg-[#10131a] px-3 py-2.5 text-sm text-white'

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/tarifas', { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar')
      onSaved(data.tarifa)
      toast.success(isNew ? 'Servicio creado' : 'Tarifa actualizada')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="tarifa-modal-title">
      <form onSubmit={save} className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0d12] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#0b0d12]/95 px-5 py-4 backdrop-blur">
          <div><h2 id="tarifa-modal-title" className="text-lg font-black text-white">{isNew ? 'Nuevo servicio' : 'Editar tarifa'}</h2><p className="mt-0.5 text-xs text-zinc-600">Los cambios quedan registrados en el historial.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-zinc-500 hover:text-white" aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Categoría"><select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className={inputClass}>{categories.map((category) => <option key={category} value={category}>{categoryConfig[category].label}</option>)}</select></Field>
          <Field label="Servicio *"><input required value={form.servicio} onChange={(e) => set('servicio', e.target.value)} className={inputClass} /></Field>
          <Field label="Familia / categoría"><input value={form.familia || ''} onChange={(e) => set('familia', e.target.value)} className={inputClass} /></Field>
          <Field label="Marca / vehículo"><input value={form.marca || ''} onChange={(e) => set('marca', e.target.value)} className={inputClass} /></Field>
          <Field label="Modelo / plataforma"><input value={form.modelo || ''} onChange={(e) => set('modelo', e.target.value)} className={inputClass} /></Field>
          <Field label="Años"><input value={form.anios || ''} onChange={(e) => set('anios', e.target.value)} className={inputClass} /></Field>
          <Field label="Motor"><input value={form.motor || ''} onChange={(e) => set('motor', e.target.value)} className={inputClass} /></Field>
          <Field label="Sistema / módulo"><input value={form.sistema || ''} onChange={(e) => set('sistema', e.target.value)} className={inputClass} /></Field>
          <Field label="ECU"><input value={form.ecu || ''} onChange={(e) => set('ecu', e.target.value)} className={inputClass} /></Field>
          <Field label="Transponder"><input value={form.transponder || ''} onChange={(e) => set('transponder', e.target.value)} className={inputClass} /></Field>
          <Field label="Espadín"><input value={form.espadin || ''} onChange={(e) => set('espadin', e.target.value)} className={inputClass} /></Field>
          <Field label="Situación / complejidad"><input value={form.situacion || ''} onChange={(e) => set('situacion', e.target.value)} className={inputClass} /></Field>
          <Field label="Combustible"><input value={form.combustible || ''} onChange={(e) => set('combustible', e.target.value)} className={inputClass} /></Field>
          <Field label="Acceso"><input value={form.acceso || ''} onChange={(e) => set('acceso', e.target.value)} className={inputClass} /></Field>
          <Field label="Plazo"><input value={form.plazo || ''} onChange={(e) => set('plazo', e.target.value)} className={inputClass} /></Field>
          <Field label="PVP recomendado *"><input required min="0" step="0.01" type="number" value={form.pvp} onChange={(e) => set('pvp', e.target.value)} className={inputClass} /></Field>
          <Field label="PVP desde"><input min="0" step="0.01" type="number" value={form.pvp_desde ?? ''} onChange={(e) => set('pvp_desde', e.target.value)} className={inputClass} /></Field>
          <Field label="PVP hasta"><input min="0" step="0.01" type="number" value={form.pvp_hasta ?? ''} onChange={(e) => set('pvp_hasta', e.target.value)} className={inputClass} /></Field>
          <Field label="Mínimo interno"><input min="0" step="0.01" type="number" value={form.precio_minimo ?? ''} onChange={(e) => set('precio_minimo', e.target.value)} className={inputClass} /></Field>
          <Field label="Taller desde"><input min="0" step="0.01" type="number" value={form.precio_taller_desde ?? ''} onChange={(e) => set('precio_taller_desde', e.target.value)} className={inputClass} /></Field>
          <Field label="Precio taller"><input min="0" step="0.01" type="number" value={form.precio_taller ?? ''} onChange={(e) => set('precio_taller', e.target.value)} className={inputClass} /></Field>
          <Field label="Taller hasta"><input min="0" step="0.01" type="number" value={form.precio_taller_hasta ?? ''} onChange={(e) => set('precio_taller_hasta', e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Regla sencilla para elegir el precio"><textarea rows={2} value={form.regla_precio || ''} onChange={(e) => set('regla_precio', e.target.value)} className={inputClass} /></Field></div>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Qué incluye"><textarea rows={2} value={form.incluye || ''} onChange={(e) => set('incluye', e.target.value)} className={inputClass} /></Field></div>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Condiciones / observaciones"><textarea rows={3} value={form.condiciones || ''} onChange={(e) => set('condiciones', e.target.value)} className={inputClass} /></Field></div>
          <label className="flex items-center gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs font-bold text-amber-100 sm:col-span-2"><input type="checkbox" checked={form.requiere_laboratorio} onChange={(e) => set('requiere_laboratorio', e.target.checked)} className="h-4 w-4" /> Obligar a confirmar con laboratorio</label>
          {!isNew ? <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-bold text-zinc-300"><input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} className="h-4 w-4" /> Servicio activo</label> : null}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/[0.08] bg-[#0b0d12]/95 px-5 py-4 backdrop-blur">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-white">Cancelar</button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c81f2a] to-[#8f141d] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Guardar tarifa</button>
        </div>
      </form>
    </div>
  )
}

export default function TarifasPanel() {
  const [rows, setRows] = useState<TarifaServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [category, setCategory] = useState<TarifaCategoria>('llaves')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [situation, setSituation] = useState('')
  const [customer, setCustomer] = useState<'particular' | 'taller'>('particular')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [editing, setEditing] = useState<TarifaServicio | null | 'new'>(null)

  useEffect(() => {
    let active = true
    fetch('/api/tarifas')
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar la tarifa')
        if (active) { setRows(data.tarifas || []); setCanEdit(Boolean(data.canEdit)) }
      })
      .catch((error) => { if (active) toast.error(error.message || 'No se pudo cargar la tarifa') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const categoryRows = useMemo(() => rows.filter((row) => row.categoria === category), [rows, category])
  const brandOptions = useMemo(() => unique(categoryRows, 'marca'), [categoryRows])
  const modelOptions = useMemo(() => unique(categoryRows.filter((row) => !brand || row.marca === brand), 'modelo'), [categoryRows, brand])
  const situationOptions = useMemo(() => unique(categoryRows, 'situacion'), [categoryRows])

  const filtered = useMemo(() => {
    const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean)
    return categoryRows.filter((row) => {
      if (brand && row.marca !== brand) return false
      if (model && row.modelo !== model) return false
      if (situation && row.situacion !== situation) return false
      if (!terms.length) return true
      const haystack = normalize(Object.values(row).join(' '))
      return terms.every((term) => haystack.includes(term))
    })
  }, [brand, categoryRows, deferredQuery, model, situation])

  function selectCategory(next: TarifaCategoria) {
    setCategory(next); setBrand(''); setModel(''); setSituation(''); setQuery(''); setVisibleCount(PAGE_SIZE)
  }

  function resetFilters() {
    setBrand(''); setModel(''); setSituation(''); setQuery(''); setVisibleCount(PAGE_SIZE)
  }

  function saved(row: TarifaServicio) {
    setRows((current) => {
      const exists = current.some((item) => item.id === row.id)
      if (!row.activo) return current.filter((item) => item.id !== row.id)
      return exists ? current.map((item) => item.id === row.id ? row : item) : [...current, row]
    })
  }

  const activeFilters = Boolean(query || brand || model || situation)

  return (
    <LabShell
      title="AK Tarifas"
      subtitle="Encuentra el precio correcto sin tener que preguntar cada vez"
      breadcrumb="AUTOKEYS CORE / ATENCIÓN AL CLIENTE"
      actions={canEdit ? <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c81f2a] to-[#8f141d] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/30"><Plus size={16} /> Nuevo servicio</button> : undefined}
    >
      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Categorías de tarifa">
        {categories.map((item) => {
          const config = categoryConfig[item]
          const Icon = config.icon
          const selected = category === item
          const count = rows.filter((row) => row.categoria === item).length
          return (
            <button key={item} type="button" onClick={() => selectCategory(item)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#c81f2a]/60 bg-[#c81f2a]/12 shadow-lg shadow-red-950/20' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'}`}>
              <div className="flex items-start justify-between gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${config.accent}`}><Icon size={19} /></div><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-black text-zinc-500">{count}</span></div>
              <p className="mt-3 text-sm font-black text-white">{config.label}</p><p className="mt-1 text-[11px] leading-4 text-zinc-600">{config.help}</p>
            </button>
          )
        })}
      </section>

      <section className="sticky top-2 z-20 mb-4 rounded-2xl border border-white/[0.08] bg-[#0a0c11]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,.7fr))_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3"><Search size={17} className="shrink-0 text-zinc-500" /><span className="sr-only">Buscar tarifa</span><input value={query} onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }} placeholder="Buscar marca, modelo, ECU, servicio…" className="w-full border-0 bg-transparent px-0 py-3 text-sm shadow-none focus:shadow-none" /></label>
          <label className="relative"><span className="sr-only">Filtrar por marca</span><select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); setVisibleCount(PAGE_SIZE) }} className="w-full appearance-none py-3 pr-9 text-sm"><option value="">Todas las marcas</option>{brandOptions.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" /></label>
          <label className="relative"><span className="sr-only">Filtrar por modelo</span><select value={model} onChange={(e) => { setModel(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-full appearance-none py-3 pr-9 text-sm"><option value="">Todos los modelos</option>{modelOptions.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" /></label>
          <label className="relative"><span className="sr-only">Filtrar por situación</span><select value={situation} onChange={(e) => { setSituation(e.target.value); setVisibleCount(PAGE_SIZE) }} className="w-full appearance-none py-3 pr-9 text-sm"><option value="">Cualquier situación</option>{situationOptions.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" /></label>
          <button type="button" onClick={resetFilters} disabled={!activeFilters} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-30"><RotateCcw size={14} /> Limpiar</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500"><Settings2 size={14} /><span>Mostrar precio para:</span><div className="flex rounded-lg border border-white/10 bg-black/30 p-0.5"><button type="button" onClick={() => setCustomer('particular')} className={`rounded-md px-3 py-1.5 font-bold ${customer === 'particular' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Particular</button><button type="button" onClick={() => setCustomer('taller')} className={`rounded-md px-3 py-1.5 font-bold ${customer === 'taller' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>Taller</button></div></div>
          <p className="text-xs font-bold text-zinc-500">{filtered.length} resultados</p>
        </div>
      </section>

      {loading ? (
        <div className="grid min-h-[320px] place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02]"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#ff5468]" /><p className="mt-3 text-sm text-zinc-500">Cargando tarifas…</p></div></div>
      ) : filtered.length ? (
        <><section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{filtered.slice(0, visibleCount).map((row) => <ServiceCard key={row.id} row={row} customer={customer} canEdit={canEdit} onEdit={(item) => setEditing(item)} />)}</section>{visibleCount < filtered.length ? <div className="mt-5 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/[0.07]">Ver {Math.min(PAGE_SIZE, filtered.length - visibleCount)} resultados más</button></div> : null}</>
      ) : (
        <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-6 text-center"><div><Search size={28} className="mx-auto text-zinc-700" /><h2 className="mt-3 font-bold text-white">No encuentro esa tarifa</h2><p className="mt-1 max-w-md text-sm text-zinc-600">Prueba a quitar algún filtro. Si el vehículo o módulo no aparece, consulta al laboratorio antes de dar un precio.</p><button type="button" onClick={resetFilters} className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300">Quitar filtros</button></div></div>
      )}

      {editing ? <EditModal initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} /> : null}
    </LabShell>
  )
}
