'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, ChevronDown, ChevronUp, Gift, Settings2 } from 'lucide-react'

type Servicio = {
  id: string
  nombre: string
  slug: string
  categoria: string
  precio: number
}

type Preset = {
  id: string
  nombre: string
  activo: boolean
  enabledForDistributor: boolean
  servicioPrincipalSlug: string
  serviciosGratis: string[]
}

export default function DistributorPricingPreset({ distribuidorId, distribuidorNombre }: { distribuidorId: string; distribuidorNombre: string }) {
  const [preset, setPreset] = useState<Preset | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [trigger, setTrigger] = useState('')
  const [gratis, setGratis] = useState<string[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/distribuidores/${distribuidorId}/reglas-precio`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar la plantilla')
      setPreset(data.preset)
      setServicios(data.servicios || [])
      setTrigger(data.preset.servicioPrincipalSlug)
      setGratis(data.preset.serviciosGratis || [])
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar la plantilla')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [distribuidorId])

  const triggerNombre = useMemo(() => servicios.find((s) => s.slug === trigger)?.nombre || trigger, [servicios, trigger])
  const gratisNombres = useMemo(() => gratis.map((slug) => servicios.find((s) => s.slug === slug)?.nombre || slug), [servicios, gratis])

  async function toggle() {
    if (!preset) return
    setSaving(true)
    try {
      const next = !preset.enabledForDistributor
      const res = await fetch(`/api/distribuidores/${distribuidorId}/reglas-precio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la plantilla')
      setPreset({ ...preset, enabledForDistributor: next })
      toast.success(`${preset.nombre} ${next ? 'activada' : 'desactivada'} para ${distribuidorNombre}`)
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  function toggleGratis(slug: string) {
    setGratis((current) => current.includes(slug) ? current.filter((x) => x !== slug) : [...current, slug])
  }

  async function guardarConfiguracion() {
    setSaving(true)
    try {
      const res = await fetch(`/api/distribuidores/${distribuidorId}/reglas-precio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure', servicioPrincipalSlug: trigger, serviciosGratis: gratis }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la plantilla')
      toast.success('Plantilla de precios actualizada')
      setConfigOpen(false)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-zinc-500">Cargando reglas rápidas...</div>
  if (!preset) return null

  return (
    <div className="mb-4 rounded-2xl border border-[#c81f2a]/25 bg-[#c81f2a]/[0.06] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#c81f2a]/15 text-[#ff5468]"><Gift size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">{preset.nombre}</div>
              <div className="mt-1 text-[11px] leading-5 text-zinc-400">Si el pedido incluye <b className="text-zinc-200">{triggerNombre}</b>, los extras configurados pasan automáticamente a <b className="text-emerald-300">0 €</b>.</div>
            </div>
            <button
              type="button"
              onClick={toggle}
              disabled={saving}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${preset.enabledForDistributor ? 'bg-emerald-500' : 'bg-zinc-700'} disabled:opacity-50`}
              aria-label={`${preset.enabledForDistributor ? 'Desactivar' : 'Activar'} ${preset.nombre}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${preset.enabledForDistributor ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {gratisNombres.map((nombre) => <span key={nombre} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-semibold text-zinc-400">{nombre}</span>)}
          </div>

          <button type="button" onClick={() => setConfigOpen((v) => !v)} className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">
            <Settings2 size={13} /> Configurar plantilla {configOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {configOpen && (
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
              <label className="block text-[11px]">
                <span className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-500">Servicio que activa la promoción</span>
                <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full text-xs">
                  {servicios.map((s) => <option key={s.id} value={s.slug}>{s.nombre} · {s.categoria}</option>)}
                </select>
              </label>

              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Servicios que quedan a 0 €</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {servicios.filter((s) => s.slug !== trigger).map((s) => {
                  const checked = gratis.includes(s.slug)
                  return (
                    <button key={s.id} type="button" onClick={() => toggleGratis(s.slug)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] ${checked ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/[0.07] bg-white/[0.02] text-zinc-500'}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-zinc-700'}`}>{checked && <Check size={11} />}</span>
                      <span className="truncate">{s.nombre}</span>
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={guardarConfiguracion} disabled={saving} className="mt-3 w-full rounded-lg bg-[#c81f2a] py-2 text-[11px] font-bold text-white hover:bg-[#e2242f] disabled:opacity-50">Guardar plantilla</button>
              <p className="mt-2 text-[10px] leading-4 text-zinc-600">La configuración es global. Cambiarla actualiza automáticamente todos los distribuidores que tengan esta plantilla activada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
