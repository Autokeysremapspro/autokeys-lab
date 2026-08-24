'use client'

import { useMemo, useState } from 'react'
import { Calculator, Check, RotateCcw, Sparkles } from 'lucide-react'

type Servicio = {
  id: string
  nombre: string
  slug: string
  categoria: string
  precio: number
  precioEfectivo?: number
  personalizado?: boolean
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
}

type AppliedRule = {
  id: string
  nombre: string
  ahorro: number
}

function money(value: number) {
  return `${Number(value || 0).toFixed(2)} €`
}

export default function DistributorPricingSimulator({
  distribuidorNombre,
  servicios,
  rules,
}: {
  distribuidorNombre: string
  servicios: Servicio[]
  rules: PricingRule[]
}) {
  const [selected, setSelected] = useState<string[]>([])

  const bySlug = useMemo(() => new Map(servicios.map((s) => [s.slug, s])), [servicios])

  const result = useMemo(() => {
    const selectedSet = new Set(selected)
    const prices = new Map<string, number>()
    let baseTotal = 0

    for (const slug of selected) {
      const servicio = bySlug.get(slug)
      if (!servicio) continue
      const precio = Number(servicio.precioEfectivo ?? servicio.precio ?? 0)
      prices.set(slug, precio)
      baseTotal += precio
    }

    const applied: AppliedRule[] = []
    const activeRules = [...rules]
      .filter((rule) => rule.enabledForDistributor)
      .sort((a, b) => Number(a.orden || 100) - Number(b.orden || 100))

    for (const rule of activeRules) {
      if (rule.tipo === 'extras_gratis') {
        if (!selectedSet.has(rule.servicioPrincipalSlug)) continue
        let ahorro = 0
        for (const slug of rule.serviciosGratis) {
          if (!selectedSet.has(slug)) continue
          const current = Number(prices.get(slug) || 0)
          if (current <= 0) continue
          ahorro += current
          prices.set(slug, 0)
        }
        if (ahorro > 0) applied.push({ id: rule.id, nombre: rule.nombre, ahorro: Number(ahorro.toFixed(2)) })
        continue
      }

      const required = Array.from(new Set(rule.serviciosRequeridos || []))
      if (required.length !== 2 || !required.every((slug) => selectedSet.has(slug))) continue
      const packPrice = Number(rule.precioConjunto)
      if (!Number.isFinite(packPrice) || packPrice < 0) continue

      const currentTotal = required.reduce((sum, slug) => sum + Number(prices.get(slug) || 0), 0)
      if (currentTotal <= packPrice) continue

      let discount = Number((currentTotal - packPrice).toFixed(2))
      const ahorro = discount
      const ordered = [...required].sort((a, b) => Number(prices.get(b) || 0) - Number(prices.get(a) || 0))

      for (const slug of ordered) {
        if (discount <= 0) break
        const current = Number(prices.get(slug) || 0)
        const reduction = Math.min(current, discount)
        prices.set(slug, Number((current - reduction).toFixed(2)))
        discount = Number((discount - reduction).toFixed(2))
      }

      applied.push({ id: rule.id, nombre: rule.nombre, ahorro })
    }

    const finalTotal = Number(Array.from(prices.values()).reduce((sum, price) => sum + price, 0).toFixed(2))
    baseTotal = Number(baseTotal.toFixed(2))
    return {
      prices,
      baseTotal,
      finalTotal,
      ahorro: Number((baseTotal - finalTotal).toFixed(2)),
      applied,
    }
  }, [selected, bySlug, rules])

  function toggle(slug: string) {
    setSelected((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug])
  }

  const categories = useMemo(() => {
    const map = new Map<string, Servicio[]>()
    for (const servicio of servicios) {
      const key = servicio.categoria || 'General'
      const current = map.get(key) || []
      current.push(servicio)
      map.set(key, current)
    }
    return Array.from(map.entries())
  }, [servicios])

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300"><Calculator size={18} /></div>
          <div>
            <div className="text-sm font-bold text-white">Simulador de precio · {distribuidorNombre}</div>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">Marca servicios y comprueba exactamente qué reglas entrarían y cuánto cobraría AK Cloud.</p>
          </div>
        </div>
        {selected.length > 0 && (
          <button type="button" onClick={() => setSelected([])} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 hover:bg-white/5 hover:text-white"><RotateCcw size={11} /> Limpiar</button>
        )}
      </div>

      <div className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
        {categories.map(([category, items]) => (
          <div key={category}>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">{category}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((servicio) => {
                const checked = selected.includes(servicio.slug)
                const efectivo = Number(servicio.precioEfectivo ?? servicio.precio ?? 0)
                return (
                  <button key={servicio.id} type="button" onClick={() => toggle(servicio.slug)} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${checked ? 'border-cyan-400/35 bg-cyan-400/10 text-white' : 'border-white/[0.07] bg-black/15 text-zinc-500 hover:border-white/15'}`}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-zinc-700'}`}>{checked && <Check size={11} />}</span>
                      <span className="truncate text-[11px] font-bold">{servicio.nombre}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-black">{money(efectivo)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <div className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Sin reglas</div>
          <div className="mt-1 text-lg font-black text-white">{money(result.baseTotal)}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3">
          <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400/60">Ahorro aplicado</div>
          <div className="mt-1 text-lg font-black text-emerald-300">{money(result.ahorro)}</div>
        </div>
        <div className="rounded-xl border border-[#c81f2a]/20 bg-[#c81f2a]/[0.06] p-3">
          <div className="text-[9px] font-black uppercase tracking-wider text-[#ff6877]/70">Total AK Cloud</div>
          <div className="mt-1 text-lg font-black text-white">{money(result.finalTotal)}</div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <div className="space-y-1.5">
            {selected.map((slug) => {
              const servicio = bySlug.get(slug)
              if (!servicio) return null
              const base = Number(servicio.precioEfectivo ?? servicio.precio ?? 0)
              const final = Number(result.prices.get(slug) ?? base)
              return (
                <div key={slug} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="truncate text-zinc-400">{servicio.nombre}</span>
                  <span className="shrink-0 font-bold text-white">{final < base ? <><span className="mr-2 text-zinc-600 line-through">{money(base)}</span><span className="text-emerald-300">{money(final)}</span></> : money(final)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-3">
        {result.applied.length > 0 ? (
          <div className="space-y-2">
            {result.applied.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[10px] font-bold text-emerald-200"><Sparkles size={12} /> {rule.nombre} · ahorro {money(rule.ahorro)}</div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] leading-5 text-zinc-600">{selected.length ? 'La combinación seleccionada no activa ninguna regla especial.' : 'Selecciona servicios para simular.'}</div>
        )}
      </div>
    </div>
  )
}
