'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Gift, Package, Pencil, Plus, Trash2, X } from 'lucide-react'

type Servicio = {
  id: string
  nombre: string
  slug: string
  categoria: string
  precio: number
}

type PricingRule = {
  id: string
  nombre: string
  tipo: 'extras_gratis' | 'combo_fijo'
  enabledForDistributor: boolean
  servicioPrincipalSlug: string
  serviciosGratis: string[]
  serviciosRequeridos: string[]
  precioConjunto: number | null
  orden: number
  nota?: string | null
}

type Draft = {
  id?: string
  nombre: string
  tipo: 'extras_gratis' | 'combo_fijo'
  servicioPrincipalSlug: string
  serviciosGratis: string[]
  serviciosRequeridos: string[]
  precioConjunto: string
  nota: string
}

const EMPTY_DRAFT: Draft = {
  nombre: '',
  tipo: 'combo_fijo',
  servicioPrincipalSlug: '',
  serviciosGratis: [],
  serviciosRequeridos: [],
  precioConjunto: '',
  nota: '',
}

export default function DistributorPricingPreset({ distribuidorId, distribuidorNombre }: { distribuidorId: string; distribuidorNombre: string }) {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/distribuidores/${distribuidorId}/reglas-precio`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las reglas')
      setRules((data.rules || []) as PricingRule[])
      setServicios((data.servicios || []) as Servicio[])
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar las reglas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [distribuidorId])

  const bySlug = useMemo(() => new Map(servicios.map((s) => [s.slug, s])), [servicios])

  function nombres(slugs: string[]) {
    return slugs.map((slug) => bySlug.get(slug)?.nombre || slug)
  }

  async function toggleRule(rule: PricingRule) {
    const next = !rule.enabledForDistributor
    setSavingId(rule.id)
    try {
      const res = await fetch(`/api/distribuidores/${distribuidorId}/reglas-precio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, enabled: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar la regla')
      setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabledForDistributor: next } : item))
      toast.success(`${rule.nombre} ${next ? 'activada' : 'desactivada'} para ${distribuidorNombre}`)
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cambiar la regla')
    } finally {
      setSavingId(null)
    }
  }

  function newRule() {
    setDraft({ ...EMPTY_DRAFT, servicioPrincipalSlug: servicios[0]?.slug || '' })
    setBuilderOpen(true)
  }

  function editRule(rule: PricingRule) {
    setDraft({
      id: rule.id,
      nombre: rule.nombre,
      tipo: rule.tipo,
      servicioPrincipalSlug: rule.servicioPrincipalSlug,
      serviciosGratis: [...rule.serviciosGratis],
      serviciosRequeridos: [...rule.serviciosRequeridos],
      precioConjunto: rule.precioConjunto == null ? '' : String(rule.precioConjunto),
      nota: rule.nota || '',
    })
    setBuilderOpen(true)
  }

  function toggleList(field: 'serviciosGratis' | 'serviciosRequeridos', slug: string) {
    setDraft((current) => {
      const values = current[field]
      return { ...current, [field]: values.includes(slug) ? values.filter((item) => item !== slug) : [...values, slug] }
    })
  }

  async function saveRule() {
    setSavingId(draft.id || 'new')
    try {
      const res = await fetch('/api/distribuidores/reglas-precio', {
        method: draft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draft.id,
          nombre: draft.nombre,
          tipo: draft.tipo,
          servicioPrincipalSlug: draft.servicioPrincipalSlug,
          serviciosGratis: draft.serviciosGratis,
          serviciosRequeridos: draft.serviciosRequeridos,
          precioConjunto: draft.precioConjunto,
          nota: draft.nota,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la regla')
      toast.success(draft.id ? 'Regla actualizada' : 'Regla creada')
      setBuilderOpen(false)
      setDraft(EMPTY_DRAFT)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la regla')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteRule(rule: PricingRule) {
    if (!window.confirm(`¿Eliminar la regla "${rule.nombre}"? Se desactivará para todos los distribuidores.`)) return
    setSavingId(rule.id)
    try {
      const res = await fetch(`/api/distribuidores/reglas-precio?id=${encodeURIComponent(rule.id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la regla')
      toast.success('Regla eliminada')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar la regla')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-zinc-500">Cargando reglas comerciales...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">Reglas disponibles</div>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">Crea una regla una sola vez y actívala con un clic en los distribuidores que quieras.</p>
        </div>
        <button type="button" onClick={newRule} className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#e2242f]">
          <Plus size={14} /> Nueva regla
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-600">Todavía no hay reglas. Crea la primera.</div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const isCombo = rule.tipo === 'combo_fijo'
            const requeridos = nombres(rule.serviciosRequeridos)
            const triggerNombre = bySlug.get(rule.servicioPrincipalSlug)?.nombre || rule.servicioPrincipalSlug
            const gratis = nombres(rule.serviciosGratis)
            return (
              <div key={rule.id} className={`rounded-2xl border p-4 ${rule.enabledForDistributor ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isCombo ? 'bg-violet-500/10 text-violet-300' : 'bg-[#c81f2a]/15 text-[#ff5468]'}`}>
                    {isCombo ? <Package size={18} /> : <Gift size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{rule.nombre}</span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">{isCombo ? 'Pack precio fijo' : 'Extras incluidos'}</span>
                        </div>
                        {isCombo ? (
                          <p className="mt-1 text-[11px] leading-5 text-zinc-400"><b className="text-zinc-200">{requeridos.join(' + ')}</b> → total del conjunto <b className="text-emerald-300">{Number(rule.precioConjunto || 0).toFixed(2)} €</b>.</p>
                        ) : (
                          <p className="mt-1 text-[11px] leading-5 text-zinc-400">Con <b className="text-zinc-200">{triggerNombre}</b>, quedan incluidos a 0 €: <b className="text-zinc-300">{gratis.join(', ')}</b>.</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRule(rule)}
                        disabled={savingId === rule.id}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${rule.enabledForDistributor ? 'bg-emerald-500' : 'bg-zinc-700'} disabled:opacity-50`}
                        aria-label={`${rule.enabledForDistributor ? 'Desactivar' : 'Activar'} ${rule.nombre}`}
                      >
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${rule.enabledForDistributor ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" onClick={() => editRule(rule)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 hover:bg-white/5 hover:text-white"><Pencil size={11} /> Editar</button>
                      <button type="button" onClick={() => deleteRule(rule)} disabled={savingId === rule.id} className="flex items-center gap-1.5 rounded-lg border border-red-500/15 px-2.5 py-1.5 text-[10px] font-bold text-red-300/70 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"><Trash2 size={11} /> Eliminar</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {builderOpen && (
        <div className="rounded-2xl border border-[#c81f2a]/25 bg-[#c81f2a]/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-white">{draft.id ? 'Editar regla' : 'Nueva regla'}</div>
            <button type="button" onClick={() => { setBuilderOpen(false); setDraft(EMPTY_DRAFT) }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><X size={15} /></button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs sm:col-span-2">
              <span className="mb-1.5 block font-bold text-zinc-500">Nombre de la regla</span>
              <input value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Ej. DPF + EGR por 35 €" className="w-full text-xs" />
            </label>
            <label className="text-xs">
              <span className="mb-1.5 block font-bold text-zinc-500">Tipo</span>
              <select value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value as Draft['tipo'] })} className="w-full text-xs">
                <option value="combo_fijo">Pack a precio fijo</option>
                <option value="extras_gratis">Extras incluidos con un servicio</option>
              </select>
            </label>
            {draft.tipo === 'combo_fijo' && (
              <label className="text-xs">
                <span className="mb-1.5 block font-bold text-zinc-500">Precio total del conjunto</span>
                <div className="flex items-center gap-2"><input type="number" min="0" step="0.01" value={draft.precioConjunto} onChange={(e) => setDraft({ ...draft, precioConjunto: e.target.value })} placeholder="35.00" className="w-full text-xs" /><span className="text-zinc-600">€</span></div>
              </label>
            )}
          </div>

          {draft.tipo === 'extras_gratis' && (
            <label className="mt-3 block text-xs">
              <span className="mb-1.5 block font-bold text-zinc-500">Servicio que activa la regla</span>
              <select value={draft.servicioPrincipalSlug} onChange={(e) => setDraft({ ...draft, servicioPrincipalSlug: e.target.value, serviciosGratis: draft.serviciosGratis.filter((slug) => slug !== e.target.value) })} className="w-full text-xs">
                {servicios.map((s) => <option key={s.id} value={s.slug}>{s.nombre} · {s.categoria}</option>)}
              </select>
            </label>
          )}

          <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">{draft.tipo === 'combo_fijo' ? 'Servicios que forman el pack' : 'Servicios incluidos a 0 €'}</div>
          <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {servicios
              .filter((s) => draft.tipo === 'combo_fijo' || s.slug !== draft.servicioPrincipalSlug)
              .map((s) => {
                const field = draft.tipo === 'combo_fijo' ? 'serviciosRequeridos' : 'serviciosGratis'
                const checked = draft[field].includes(s.slug)
                return (
                  <button key={s.id} type="button" onClick={() => toggleList(field, s.slug)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] ${checked ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/[0.07] bg-white/[0.02] text-zinc-500'}`}>
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-zinc-700'}`}>{checked && <Check size={11} />}</span>
                    <span className="truncate">{s.nombre}</span>
                  </button>
                )
              })}
          </div>

          <label className="mt-3 block text-xs">
            <span className="mb-1.5 block font-bold text-zinc-500">Nota interna (opcional)</span>
            <input value={draft.nota} onChange={(e) => setDraft({ ...draft, nota: e.target.value })} placeholder="Ej. tarifa especial para distribuidores con volumen" className="w-full text-xs" />
          </label>

          <button type="button" onClick={saveRule} disabled={savingId === (draft.id || 'new')} className="mt-4 w-full rounded-xl bg-[#c81f2a] py-2.5 text-xs font-bold text-white hover:bg-[#e2242f] disabled:opacity-50">{savingId === (draft.id || 'new') ? 'Guardando...' : draft.id ? 'Guardar cambios' : 'Crear regla'}</button>
          <p className="mt-2 text-[10px] leading-4 text-zinc-600">Crear o editar una regla no la activa automáticamente en todos. Después usas el interruptor de cada distribuidor para decidir dónde se aplica.</p>
        </div>
      )}
    </div>
  )
}
