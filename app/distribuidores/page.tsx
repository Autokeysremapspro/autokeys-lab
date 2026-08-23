'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Building2, UserPlus, TrendingUp, Percent, Search, SlidersHorizontal, Download, Phone, Mail, Send, Tag, Settings2 } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import FormModal from '@/components/FormModal'
import ConfirmModal from '@/components/ConfirmModal'
import { money } from '@/lib/status'
import { CATEGORIA_LABELS, type ServicioConPrecio } from '@/lib/services/precios'

type Distribuidor = {
  id: string
  empresa: string
  nombre_contacto: string | null
  email: string
  telefono: string | null
  ciudad: string | null
  pais: string | null
  nivel: string
  descuento_porcentaje: number
  comision_porcentaje: number
  limite_credito: number
  estado: string
  etiqueta: string | null
  notas_internas: string | null
  comercial_nombre: string | null
  comercial_telefono: string | null
  comercial_email: string | null
  created_at: string
  pedidos_30d: number
  facturacion_30d: number
  comision_30d: number
  ordenes_recientes: { id: string; servicio: string; precio: number; created_at: string }[]
  tickets: { id: string; numero: string | null; asunto: string; estado: string; created_at: string }[]
  tickets_abiertos: number
  precios_personalizados: number
}

type TarifaServicio = { id: string; nombre: string; categoria: string; precio: number; activo: boolean; distribuidoresConOverride: number }

const NIVEL_TONE: Record<string, 'purple' | 'amber' | 'zinc' | 'blue'> = { Platinum: 'purple', Gold: 'amber', Silver: 'blue', Bronze: 'zinc' }

type Tab = 'resumen' | 'condiciones' | 'precios' | 'documentos'

function groupByCategoria<T extends { categoria: string }>(items: T[]) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const arr = groups.get(item.categoria) || []
    arr.push(item)
    groups.set(item.categoria, arr)
  }
  return Array.from(groups.entries())
}

export default function DistribuidoresPage() {
  const [rows, setRows] = useState<Distribuidor[]>([])
  const [ventasCanal, setVentasCanal] = useState(0)
  const [comisionesCanal, setComisionesCanal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('resumen')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Distribuidor>>({})

  const [tarifaDistribuidor, setTarifaDistribuidor] = useState<ServicioConPrecio[]>([])
  const [tarifaLoading, setTarifaLoading] = useState(false)
  const [precioDraft, setPrecioDraft] = useState<Record<string, string>>({})
  const [savingPrecio, setSavingPrecio] = useState<string | null>(null)

  const [tarifaEstandar, setTarifaEstandar] = useState<TarifaServicio[]>([])
  const [tarifaModalOpen, setTarifaModalOpen] = useState(false)
  const [tarifaDraft, setTarifaDraft] = useState<Record<string, string>>({})
  const [savingTarifa, setSavingTarifa] = useState<string | null>(null)
  const [pendingTarifaCambio, setPendingTarifaCambio] = useState<{ id: string; nombre: string; precio: number; afectados: number } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/distribuidores')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error cargando distribuidores')
      setRows(data.distribuidores)
      setVentasCanal(data.ventasCanal)
      setComisionesCanal(data.comisionesCanal)
      if (data.distribuidores.length && !selectedId) setSelectedId(data.distribuidores[0].id)
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar los distribuidores')
    } finally {
      setLoading(false)
    }
  }

  async function loadTarifaDistribuidor(distribuidorId: string) {
    setTarifaLoading(true)
    try {
      const res = await fetch(`/api/distribuidores/${distribuidorId}/tarifa`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTarifaDistribuidor(data.servicios)
      setPrecioDraft({})
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar la tarifa del distribuidor')
    } finally {
      setTarifaLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.empresa, r.nombre_contacto, r.ciudad, r.email].some((v) => (v || '').toLowerCase().includes(q)))
  }, [rows, query])

  const selected = rows.find((r) => r.id === selectedId) || null

  useEffect(() => {
    if (selected) setForm(selected)
  }, [selectedId])

  useEffect(() => {
    if (selected && tab === 'precios') loadTarifaDistribuidor(selected.id)
  }, [selectedId, tab])

  const activos = rows.filter((r) => r.estado === 'activo').length
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
  const nuevos = rows.filter((r) => new Date(r.created_at) >= monthAgo).length

  async function guardarCondiciones() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/distribuidores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          nivel: form.nivel,
          descuento_porcentaje: Number(form.descuento_porcentaje || 0),
          comision_porcentaje: Number(form.comision_porcentaje || 0),
          limite_credito: Number(form.limite_credito || 0),
          notas_internas: form.notas_internas,
          comercial_nombre: form.comercial_nombre,
          comercial_telefono: form.comercial_telefono,
          comercial_email: form.comercial_email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Ficha del distribuidor actualizada')
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function guardarPrecio(servicio: ServicioConPrecio) {
    if (!selected) return
    const raw = precioDraft[servicio.id]
    const precio = Number(raw)
    if (raw === undefined || raw === '' || !Number.isFinite(precio) || precio < 0) {
      toast.error('Introduce un precio válido')
      return
    }
    setSavingPrecio(servicio.id)
    try {
      const res = await fetch('/api/distribuidores/precios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distribuidor_id: selected.id, servicio_id: servicio.id, precio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Precio de "${servicio.nombre}" fijado para ${selected.empresa}`)
      await loadTarifaDistribuidor(selected.id)
      load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar el precio')
    } finally {
      setSavingPrecio(null)
    }
  }

  async function usarTarifaEstandar(servicio: ServicioConPrecio) {
    if (!selected || !servicio.overrideId) return
    setSavingPrecio(servicio.id)
    try {
      const res = await fetch(`/api/distribuidores/precios?id=${servicio.overrideId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPrecioDraft((prev) => { const next = { ...prev }; delete next[servicio.id]; return next })
      toast.success(`"${servicio.nombre}" vuelve a la tarifa estándar para ${selected.empresa}`)
      await loadTarifaDistribuidor(selected.id)
      load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo quitar el precio')
    } finally {
      setSavingPrecio(null)
    }
  }

  async function openTarifaModal() {
    setTarifaModalOpen(true)
    try {
      const res = await fetch('/api/distribuidores/tarifa-estandar')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTarifaEstandar(data.servicios)
      const draft: Record<string, string> = {}
      for (const s of data.servicios as TarifaServicio[]) draft[s.id] = String(s.precio)
      setTarifaDraft(draft)
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar la tarifa estándar')
    }
  }

  function pedirConfirmacionTarifa(servicio: TarifaServicio) {
    const raw = tarifaDraft[servicio.id]
    const precio = Number(raw)
    if (raw === undefined || raw === '' || !Number.isFinite(precio) || precio < 0) {
      toast.error('Introduce un precio válido')
      return
    }
    if (precio === servicio.precio) return
    setPendingTarifaCambio({ id: servicio.id, nombre: servicio.nombre, precio, afectados: servicio.distribuidoresConOverride })
  }

  async function confirmarCambioTarifa() {
    if (!pendingTarifaCambio) return
    const { id, nombre, precio } = pendingTarifaCambio
    setSavingTarifa(id)
    try {
      const res = await fetch('/api/distribuidores/tarifa-estandar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio_id: id, precio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Tarifa estándar de "${nombre}" actualizada`)
      setPendingTarifaCambio(null)
      openTarifaModal()
      if (selected) loadTarifaDistribuidor(selected.id)
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la tarifa')
    } finally {
      setSavingTarifa(null)
    }
  }

  const badge = selected ? { tone: NIVEL_TONE[selected.nivel] || 'zinc' } : null

  return (
    <LabShell
      title="Distribuidores"
      subtitle="Gestión de distribuidores y red de partners"
      actions={
        <>
          <Link href="/ak-cloud/solicitudes" className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
            <UserPlus size={16} /> Nuevo distribuidor
          </Link>
          <button onClick={openTarifaModal} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]"><Settings2 size={15} /> Tarifa estándar</button>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]"><Download size={15} /> Exportar</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Building2 size={19} />} tone="green" label="Distribuidores activos" value={activos} trend={8} subtitle="vs. mes anterior" />
          <LabStatCard icon={<UserPlus size={19} />} tone="blue" label="Nuevos distribuidores" value={nuevos} trend={20} subtitle="vs. mes anterior" />
          <LabStatCard icon={<TrendingUp size={19} />} tone="purple" label="Ventas del canal (30d)" value={money(ventasCanal)} trend={15} subtitle="vs. mes anterior" />
          <LabStatCard icon={<Percent size={19} />} tone="orange" label="Comisiones generadas" value={money(comisionesCanal)} trend={12} subtitle="vs. mes anterior" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_460px]">
          <LabPanel padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] p-4">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar distribuidor..." className="w-full border-0 bg-transparent p-0 text-sm" />
              </div>
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><SlidersHorizontal size={14} /> Filtros</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Empresa</th>
                    <th className="px-3 py-3 font-bold">Contacto</th>
                    <th className="px-3 py-3 font-bold">Ciudad</th>
                    <th className="px-3 py-3 font-bold">Nivel</th>
                    <th className="px-3 py-3 font-bold text-right">Precios propios</th>
                    <th className="px-3 py-3 font-bold text-right">Pedidos (30d)</th>
                    <th className="px-3 py-3 font-bold text-right">Facturación (30d)</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} onClick={() => { setSelectedId(d.id); setTab('resumen') }} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === d.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}>
                      <td className="px-5 py-3 font-bold text-white">{d.empresa}</td>
                      <td className="px-3 py-3 text-zinc-300">{d.nombre_contacto || '—'}</td>
                      <td className="px-3 py-3 text-zinc-400">{[d.ciudad, d.pais].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-3 py-3"><LabBadge tone={NIVEL_TONE[d.nivel] || 'zinc'}>{d.nivel}</LabBadge></td>
                      <td className="px-3 py-3 text-right text-zinc-300">{d.precios_personalizados > 0 ? <LabBadge tone="purple">{d.precios_personalizados}</LabBadge> : <span className="text-zinc-600">Estándar</span>}</td>
                      <td className="px-3 py-3 text-right text-zinc-300">{d.pedidos_30d}</td>
                      <td className="px-3 py-3 text-right font-bold text-white">{money(d.facturacion_30d)}</td>
                      <td className="px-3 py-3"><LabBadge tone={d.estado === 'activo' ? 'green' : d.estado === 'suspendido' ? 'amber' : 'red'}>{d.estado}</LabBadge></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-zinc-600">Ningún distribuidor coincide con esa búsqueda.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 text-xs text-zinc-500">Mostrando 1 a {filtered.length} de {rows.length} distribuidores</div>
          </LabPanel>

          <LabPanel title="Detalle del distribuidor">
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona un distribuidor de la lista.</div>
            ) : (
              <div>
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#c81f2a]/15 text-sm font-bold text-[#ff5468]">
                    {selected.empresa.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-white">{selected.empresa}</span>
                      {badge && <LabBadge tone={badge.tone}>{selected.nivel}</LabBadge>}
                    </div>
                    <div className="text-xs text-zinc-500">Cliente desde {new Date(selected.created_at).toLocaleDateString('es-ES')}</div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                  <div className="font-bold text-zinc-600">Contacto principal</div>
                  <div>{selected.nombre_contacto || '—'}</div>
                  {selected.telefono && <div className="flex items-center gap-1.5"><Phone size={12} /> {selected.telefono}</div>}
                  <div className="flex items-center gap-1.5"><Mail size={12} /> {selected.email}</div>
                </div>

                <div className="mt-4 flex gap-1 border-b border-white/[0.07]">
                  {(['resumen', 'condiciones', 'precios', 'documentos'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`rounded-t-lg px-3.5 py-2 text-xs font-bold capitalize ${tab === t ? 'border-b-2 border-[#ff3b46] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{t}</button>
                  ))}
                </div>

                <div className="pt-4">
                  {tab === 'resumen' && (
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas de cuenta</div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">{selected.notas_internas || 'Sin notas registradas.'}</div>
                      </div>

                      <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Órdenes recientes (archivos vendidos)</div>
                        <div className="space-y-1.5">
                          {selected.ordenes_recientes.map((o) => (
                            <div key={o.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                              <span className="truncate text-zinc-300">{o.servicio}</span>
                              <span className="shrink-0 font-bold text-zinc-200">{money(o.precio)}</span>
                            </div>
                          ))}
                          {selected.ordenes_recientes.length === 0 && <div className="text-xs text-zinc-600">Sin ventas en los últimos 30 días.</div>}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600">
                          <span>Tickets de soporte</span>
                          {selected.tickets_abiertos > 0 && <LabBadge tone="amber">{selected.tickets_abiertos} abiertos</LabBadge>}
                        </div>
                        <div className="space-y-1.5">
                          {selected.tickets.map((t) => (
                            <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                              <span className="truncate text-zinc-300">{t.numero ? `#${t.numero} · ` : ''}{t.asunto}</span>
                              <LabBadge tone={t.estado === 'cerrado' ? 'zinc' : t.estado === 'en_curso' ? 'blue' : 'amber'}>{t.estado.replace('_', ' ')}</LabBadge>
                            </div>
                          ))}
                          {selected.tickets.length === 0 && <div className="text-xs text-zinc-600">Sin tickets registrados.</div>}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Comercial asignado</div>
                        {selected.comercial_nombre ? (
                          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <div className="text-xs">
                              <div className="font-bold text-white">{selected.comercial_nombre}</div>
                              <div className="mt-0.5 text-zinc-500">{selected.comercial_telefono}</div>
                            </div>
                            {selected.comercial_email && (
                              <a href={`mailto:${selected.comercial_email}`} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/[0.09]"><Send size={12} /> Enviar mensaje</a>
                            )}
                          </div>
                        ) : <div className="text-xs text-zinc-600">Sin comercial asignado — asígnalo en la pestaña Condiciones.</div>}
                      </div>
                    </div>
                  )}

                  {tab === 'condiciones' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Nivel</span>
                          <select value={form.nivel || 'Bronze'} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className="w-full text-xs">
                            {['Platinum', 'Gold', 'Silver', 'Bronze'].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Descuento %</span>
                          <input type="number" value={form.descuento_porcentaje ?? 0} onChange={(e) => setForm({ ...form, descuento_porcentaje: Number(e.target.value) })} className="w-full text-xs" />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Comisión %</span>
                          <input type="number" value={form.comision_porcentaje ?? 0} onChange={(e) => setForm({ ...form, comision_porcentaje: Number(e.target.value) })} className="w-full text-xs" />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Límite de crédito</span>
                          <input type="number" value={form.limite_credito ?? 0} onChange={(e) => setForm({ ...form, limite_credito: Number(e.target.value) })} className="w-full text-xs" />
                        </label>
                        <label className="col-span-2 text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Comercial asignado</span>
                          <input placeholder="Nombre" value={form.comercial_nombre || ''} onChange={(e) => setForm({ ...form, comercial_nombre: e.target.value })} className="w-full text-xs" />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Teléfono comercial</span>
                          <input value={form.comercial_telefono || ''} onChange={(e) => setForm({ ...form, comercial_telefono: e.target.value })} className="w-full text-xs" />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Email comercial</span>
                          <input value={form.comercial_email || ''} onChange={(e) => setForm({ ...form, comercial_email: e.target.value })} className="w-full text-xs" />
                        </label>
                        <label className="col-span-2 text-xs">
                          <span className="mb-1 block font-bold text-zinc-500">Notas de cuenta</span>
                          <textarea rows={3} value={form.notas_internas || ''} onChange={(e) => setForm({ ...form, notas_internas: e.target.value })} className="w-full text-xs" />
                        </label>
                      </div>
                      <button onClick={guardarCondiciones} disabled={saving} className="w-full rounded-xl bg-[#c81f2a] py-2.5 text-xs font-bold text-white hover:bg-[#e2242f] disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar condiciones'}
                      </button>
                    </div>
                  )}

                  {tab === 'precios' && (
                    <div>
                      <p className="mb-3 text-xs text-zinc-500">
                        Precio efectivo = precio personalizado de <b className="text-zinc-300">{selected.empresa}</b>, o la tarifa estándar si no tiene uno propio.
                        Esto no toca la tarifa estándar ni los precios de otros distribuidores.
                      </p>
                      {tarifaLoading ? (
                        <div className="py-8 text-center text-xs text-zinc-600">Cargando catálogo...</div>
                      ) : (
                        <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                          {groupByCategoria(tarifaDistribuidor).map(([categoria, servicios]) => (
                            <div key={categoria}>
                              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">{CATEGORIA_LABELS[categoria] || categoria}</div>
                              <div className="space-y-2">
                                {servicios.map((s) => (
                                  <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <Tag size={13} className="shrink-0 text-zinc-600" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="truncate text-xs font-semibold text-zinc-200">{s.nombre}</span>
                                          <LabBadge tone={s.personalizado ? 'purple' : 'zinc'}>{s.personalizado ? 'Personalizado' : 'Estándar'}</LabBadge>
                                        </div>
                                        <div className="text-[10px] text-zinc-600">Tarifa estándar: {s.tarifaEstandar.toFixed(2)} € · Precio aplicado: <b className="text-zinc-400">{s.precioEfectivo.toFixed(2)} €</b></div>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder={s.tarifaEstandar.toFixed(2)}
                                          value={precioDraft[s.id] ?? ''}
                                          onChange={(e) => setPrecioDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                          className="w-20 border-0 bg-transparent p-0 text-right text-xs"
                                        />
                                        <span className="text-[10px] text-zinc-600">€</span>
                                      </div>
                                      <button
                                        onClick={() => guardarPrecio(s)}
                                        disabled={savingPrecio === s.id}
                                        className="shrink-0 rounded-lg bg-[#c81f2a] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#e2242f] disabled:opacity-50"
                                      >
                                        Guardar
                                      </button>
                                      {s.personalizado && (
                                        <button onClick={() => usarTarifaEstandar(s)} disabled={savingPrecio === s.id} className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:bg-white/5 hover:text-white">
                                          Usar tarifa estándar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {tarifaDistribuidor.length === 0 && <div className="py-8 text-center text-xs text-zinc-600">Sin servicios activos en el catálogo.</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'documentos' && <div className="py-8 text-center text-xs text-zinc-600">Sin documentos todavía.</div>}
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <FormModal open={tarifaModalOpen} onClose={() => setTarifaModalOpen(false)} title="Tarifa estándar">
        <p className="mb-4 text-xs text-zinc-500">Este es el precio de catálogo (akcloud_servicios) que ve cualquier distribuidor sin un precio propio asignado — incluidos los nuevos. Los distribuidores con precio personalizado no se ven afectados por estos cambios.</p>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {groupByCategoria(tarifaEstandar).map(([categoria, servicios]) => (
            <div key={categoria}>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">{CATEGORIA_LABELS[categoria] || categoria}</div>
              <div className="space-y-2">
                {servicios.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <Tag size={13} className="shrink-0 text-zinc-600" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-zinc-300">{s.nombre}</div>
                      {s.distribuidoresConOverride > 0 && <div className="text-[10px] text-zinc-600">{s.distribuidoresConOverride} distribuidor(es) con precio propio — no se verán afectados</div>}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                      <input
                        type="number"
                        step="0.01"
                        value={tarifaDraft[s.id] ?? ''}
                        onChange={(e) => setTarifaDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-20 border-0 bg-transparent p-0 text-right text-xs"
                      />
                      <span className="text-[10px] text-zinc-600">€</span>
                    </div>
                    <button
                      onClick={() => pedirConfirmacionTarifa(s)}
                      disabled={savingTarifa === s.id}
                      className="shrink-0 rounded-lg bg-[#c81f2a] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#e2242f] disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tarifaEstandar.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Cargando catálogo...</div>}
        </div>
      </FormModal>

      <ConfirmModal
        open={Boolean(pendingTarifaCambio)}
        title={`Cambiar tarifa estándar de "${pendingTarifaCambio?.nombre || ''}"`}
        description={`Este cambio afectará a todos los distribuidores que actualmente utilizan la tarifa estándar para este servicio${pendingTarifaCambio?.afectados ? ` (${pendingTarifaCambio.afectados} distribuidor(es) con precio propio no se verán afectados)` : ''}. Nuevo precio: ${pendingTarifaCambio?.precio.toFixed(2)} €.`}
        confirmLabel="Sí, cambiar tarifa estándar"
        loading={savingTarifa === pendingTarifaCambio?.id}
        onConfirm={confirmarCambioTarifa}
        onCancel={() => setPendingTarifaCambio(null)}
      />
    </LabShell>
  )
}
