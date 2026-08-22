'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Building2, UserPlus, TrendingUp, Percent, Search, SlidersHorizontal, Download, Phone, Mail, Send, Tag, X } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { money } from '@/lib/status'

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
  precios: { id: string; servicio: string; precio: number }[]
}

const NIVEL_TONE: Record<string, 'purple' | 'amber' | 'zinc' | 'blue'> = { Platinum: 'purple', Gold: 'amber', Silver: 'blue', Bronze: 'zinc' }

const SERVICIOS_TARIFA = ['Stage 1', 'Stage 2', 'DPF OFF', 'EGR OFF', 'AdBlue / SCR OFF', 'IMMO OFF', 'Pops & Bangs', 'Hardcut', 'Clone / Repair', 'DTC Off', 'Speed Limit Off']

type Tab = 'resumen' | 'condiciones' | 'precios' | 'documentos'

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
  const [precioDraft, setPrecioDraft] = useState<Record<string, string>>({})
  const [savingPrecio, setSavingPrecio] = useState<string | null>(null)

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.empresa, r.nombre_contacto, r.ciudad, r.email].some((v) => (v || '').toLowerCase().includes(q)))
  }, [rows, query])

  const selected = rows.find((r) => r.id === selectedId) || null

  useEffect(() => {
    if (selected) {
      setForm(selected)
      const draft: Record<string, string> = {}
      for (const p of selected.precios) draft[p.servicio] = String(p.precio)
      setPrecioDraft(draft)
    }
  }, [selectedId])

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

  async function guardarPrecio(servicio: string) {
    if (!selected) return
    const raw = precioDraft[servicio]
    const precio = Number(raw)
    if (raw === undefined || raw === '' || !Number.isFinite(precio) || precio < 0) {
      toast.error('Introduce un precio válido')
      return
    }
    setSavingPrecio(servicio)
    try {
      const res = await fetch('/api/distribuidores/precios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distribuidor_id: selected.id, servicio, precio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Precio de "${servicio}" actualizado para ${selected.empresa}`)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar el precio')
    } finally {
      setSavingPrecio(null)
    }
  }

  async function quitarPrecio(servicio: string) {
    if (!selected) return
    const existing = selected.precios.find((p) => p.servicio === servicio)
    if (!existing) return
    setSavingPrecio(servicio)
    try {
      const res = await fetch(`/api/distribuidores/precios?id=${existing.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPrecioDraft((prev) => { const next = { ...prev }; delete next[servicio]; return next })
      toast.success(`"${servicio}" vuelve a la tarifa estándar`)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo quitar el precio')
    } finally {
      setSavingPrecio(null)
    }
  }

  return (
    <LabShell
      title="Distribuidores"
      subtitle="Gestión de distribuidores y red de partners"
      actions={
        <>
          <Link href="/ak-cloud/solicitudes" className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
            <UserPlus size={16} /> Nuevo distribuidor
          </Link>
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

        <div className="grid gap-4 2xl:grid-cols-[1fr_420px]">
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
                    <th className="px-3 py-3 font-bold text-right">Descuento</th>
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
                      <td className="px-3 py-3 text-right text-zinc-300">{d.descuento_porcentaje}%</td>
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
                      <LabBadge tone={NIVEL_TONE[selected.nivel] || 'zinc'}>{selected.nivel}</LabBadge>
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
                      <p className="mb-3 text-xs text-zinc-500">Fija un precio manual por servicio para <b className="text-zinc-300">{selected.empresa}</b>. Los servicios sin precio propio usan la tarifa estándar.</p>
                      <div className="space-y-2">
                        {SERVICIOS_TARIFA.map((servicio) => {
                          const tieneOverride = selected.precios.some((p) => p.servicio === servicio)
                          return (
                            <div key={servicio} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                              <Tag size={13} className="shrink-0 text-zinc-600" />
                              <span className="flex-1 truncate text-xs font-semibold text-zinc-300">{servicio}</span>
                              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Estándar"
                                  value={precioDraft[servicio] ?? ''}
                                  onChange={(e) => setPrecioDraft((prev) => ({ ...prev, [servicio]: e.target.value }))}
                                  className="w-20 border-0 bg-transparent p-0 text-right text-xs"
                                />
                                <span className="text-[10px] text-zinc-600">€</span>
                              </div>
                              <button
                                onClick={() => guardarPrecio(servicio)}
                                disabled={savingPrecio === servicio}
                                className="shrink-0 rounded-lg bg-[#c81f2a] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#e2242f] disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              {tieneOverride && (
                                <button onClick={() => quitarPrecio(servicio)} disabled={savingPrecio === servicio} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400">
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {tab === 'documentos' && <div className="py-8 text-center text-xs text-zinc-600">Sin documentos todavía.</div>}
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}
