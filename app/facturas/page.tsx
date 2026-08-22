'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Users,
  Package,
  Lock,
  Clock,
  SlidersHorizontal,
  FileText,
  ClipboardList,
  Truck,
  Receipt,
  MoreVertical,
  Eye,
  Printer,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge, LabLineChart, LabBarChart, LabDonut } from '@/components/lab'
import FormModal from '@/components/FormModal'
import ConfirmModal from '@/components/ConfirmModal'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'

type Documento = {
  id: string
  cliente_id?: string | null
  tipo_documento?: string | null
  numero_documento?: string | null
  fecha?: string | null
  subtotal?: number | null
  iva_importe?: number | null
  total?: number | null
  estado?: string | null
  created_at?: string
  clientes?: { nombre?: string | null } | null
  concepto?: string
}

const emptyForm = { tipo_documento: 'factura', cliente_id: '', estado: 'pendiente', iva_porcentaje: 21, notas: '', concepto: 'Servicio Autokeys Lab', precio: 0 }

function isVencida(doc: Documento) {
  if (doc.estado !== 'pendiente' || !doc.fecha) return false
  const dias = (Date.now() - new Date(doc.fecha).getTime()) / 86400000
  return dias > 15
}

function estadoInfo(doc: Documento) {
  if (doc.estado === 'pagada') return { tone: 'green' as const, label: 'Pagada' }
  if (doc.estado === 'cancelada') return { tone: 'zinc' as const, label: 'Cancelada' }
  if (isVencida(doc)) return { tone: 'red' as const, label: 'Vencida' }
  return { tone: 'amber' as const, label: 'Pendiente' }
}

function daysInMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export default function FacturasPage() {
  const [items, setItems] = useState<Documento[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('todas')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Documento | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [{ data: docs, error: docsError }, { data: cli, error: cliError }] = await Promise.all([
        supabase.from('facturas').select('*,clientes(nombre)').order('created_at', { ascending: false }),
        supabase.from('clientes').select('id,nombre').order('nombre'),
      ])
      if (docsError) throw docsError
      if (cliError) throw cliError

      const rows = (docs || []) as Documento[]
      const ids = rows.slice(0, 10).map((r) => r.id)
      if (ids.length) {
        const { data: lineas } = await supabase.from('lineas_factura').select('factura_id,concepto').in('factura_id', ids)
        const conceptMap = new Map<string, string>()
        for (const l of lineas || []) if (!conceptMap.has(l.factura_id)) conceptMap.set(l.factura_id, l.concepto)
        rows.forEach((r) => { r.concepto = conceptMap.get(r.id) })
      }

      setItems(rows)
      setClientes(cli || [])
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (tipoFiltro === 'todas') return items
    return items.filter((i) => i.tipo_documento === tipoFiltro)
  }, [items, tipoFiltro])

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'

  const facturadoHoy = items.filter((i) => (i.fecha || i.created_at || '').startsWith(today)).reduce((a, i) => a + Number(i.total || 0), 0)
  const facturasEsteMes = items.filter((i) => (i.fecha || i.created_at || '') >= monthStart)
  const facturadoMes = facturasEsteMes.reduce((a, i) => a + Number(i.total || 0), 0)
  const pendientes = items.filter((i) => i.estado === 'pendiente' || isVencida(i))
  const pendienteTotal = pendientes.reduce((a, i) => a + Number(i.total || 0), 0)
  const ticketMedio = facturasEsteMes.length ? facturadoMes / facturasEsteMes.length : 0

  const dias = daysInMonth()
  const dayLabels = Array.from({ length: dias }, (_, i) => String(i + 1).padStart(2, '0'))
  const ingresosPorDia = Array.from({ length: dias }, () => 0)
  const cobradosPorDia = Array.from({ length: dias }, () => 0)
  const pendientesPorDia = Array.from({ length: dias }, () => 0)
  for (const i of facturasEsteMes) {
    const d = Number((i.fecha || i.created_at || '').slice(8, 10)) - 1
    if (d < 0 || d >= dias) continue
    ingresosPorDia[d] += Number(i.total || 0)
    if (i.estado === 'pagada') cobradosPorDia[d] += Number(i.total || 0)
    else pendientesPorDia[d] += Number(i.total || 0)
  }
  const ingresosAcumulado = ingresosPorDia.reduce<number[]>((acc, v, idx) => { acc.push((acc[idx - 1] || 0) + v); return acc }, [])

  const cobradas = items.filter((i) => i.estado === 'pagada').reduce((a, i) => a + Number(i.total || 0), 0)
  const vencidas = items.filter((i) => isVencida(i)).reduce((a, i) => a + Number(i.total || 0), 0)
  const pendientesSinVencer = pendienteTotal - vencidas
  const totalCobros = cobradas + pendienteTotal || 1

  async function save(e: any) {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('facturas')
        .insert({
          tipo_documento: form.tipo_documento,
          cliente_id: form.cliente_id || null,
          estado: form.estado || 'pendiente',
          iva_porcentaje: Number(form.iva_porcentaje || 21),
          notas: form.notas || null,
        })
        .select('*')
        .single()
      if (error) throw error

      const precio = Number(form.precio || 0)
      if (form.concepto || precio > 0) {
        await supabase.from('lineas_factura').insert({ factura_id: data.id, concepto: form.concepto || 'Servicio Autokeys Lab', cantidad: 1, precio_unitario: precio })
      }
      toast.success('Documento creado')
      setOpen(false)
      setForm(emptyForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'Error guardando documento')
    }
  }

  function crearDocumento(tipo: string) {
    setForm({ ...emptyForm, tipo_documento: tipo })
    setOpen(true)
  }

  function abrirDocumento(id: string, imprimir = false) {
    const url = imprimir ? `/api/documentos/${id}?print=1` : `/api/documentos/${id}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setMenuOpen(null)
  }

  async function marcarPagada(doc: Documento) {
    const { error } = await supabase.from('facturas').update({ estado: 'pagada' }).eq('id', doc.id)
    setMenuOpen(null)
    if (error) { toast.error(error.message); return }
    toast.success('Documento marcado como pagada')
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const { error } = await supabase.from('facturas').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Documento eliminado')
    setPendingDelete(null)
    load()
  }

  const quickDocs = [
    { tipo: 'factura', label: 'Factura', desc: 'Generar nueva factura', icon: FileText, tone: 'red' as const },
    { tipo: 'presupuesto', label: 'Presupuesto', desc: 'Crear presupuesto', icon: ClipboardList, tone: 'orange' as const },
    { tipo: 'albaran', label: 'Albarán', desc: 'Generar albarán de entrega', icon: Truck, tone: 'blue' as const },
    { tipo: 'ticket', label: 'Ticket', desc: 'Crear ticket de venta', icon: Receipt, tone: 'purple' as const },
  ]

  return (
    <LabShell title="Facturación">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Users size={19} />} tone="red" label="Facturado hoy" value={money(facturadoHoy)} trend={18} subtitle="vs ayer" />
          <LabStatCard icon={<Package size={19} />} tone="orange" label="Facturado este mes" value={money(facturadoMes)} trend={22} subtitle="vs mes anterior" />
          <LabStatCard icon={<Lock size={19} />} tone="blue" label="Pendiente de cobro" value={money(pendienteTotal)} subtitle={`${pendientes.length} facturas`} />
          <LabStatCard icon={<Clock size={19} />} tone="green" label="Ticket medio" value={money(ticketMedio)} trend={8} subtitle="vs mes anterior" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_320px]">
          <LabPanel padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4">
              <h2 className="text-[15px] font-bold text-white">Facturas recientes</h2>
              <div className="flex items-center gap-2">
                <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold">
                  <option value="todas">Ver: Todas</option>
                  <option value="factura">Facturas</option>
                  <option value="presupuesto">Presupuestos</option>
                  <option value="albaran">Albaranes</option>
                  <option value="ticket">Tickets</option>
                </select>
                <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><SlidersHorizontal size={13} /> Filtros</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Número</th>
                    <th className="px-3 py-3 font-bold">Cliente</th>
                    <th className="px-3 py-3 font-bold">Concepto</th>
                    <th className="px-3 py-3 font-bold text-right">Base</th>
                    <th className="px-3 py-3 font-bold text-right">IVA</th>
                    <th className="px-3 py-3 font-bold text-right">Total</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-3 py-3 font-bold">Fecha</th>
                    <th className="px-3 py-3 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 8).map((doc) => {
                    const info = estadoInfo(doc)
                    return (
                      <tr key={doc.id} className="border-t border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-bold text-white">{doc.numero_documento || 'Sin número'}</td>
                        <td className="px-3 py-3 text-zinc-300">{doc.clientes?.nombre || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{doc.concepto || doc.tipo_documento}</td>
                        <td className="px-3 py-3 text-right text-zinc-400">{money(doc.subtotal)}</td>
                        <td className="px-3 py-3 text-right text-zinc-400">{money(doc.iva_importe)}</td>
                        <td className="px-3 py-3 text-right font-bold text-white">{money(doc.total)}</td>
                        <td className="px-3 py-3"><LabBadge tone={info.tone}>{info.label}</LabBadge></td>
                        <td className="px-3 py-3 text-zinc-500">{doc.fecha ? new Date(doc.fecha).toLocaleDateString('es-ES') : '—'}</td>
                        <td className="relative px-3 py-3">
                          <button onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><MoreVertical size={15} /></button>
                          {menuOpen === doc.id && (
                            <>
                              <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(null)} aria-hidden />
                              <div className="absolute right-3 top-10 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0e0f14] py-1 shadow-2xl">
                                <button onClick={() => abrirDocumento(doc.id)} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-white/5"><Eye size={13} /> Ver PDF</button>
                                <button onClick={() => abrirDocumento(doc.id, true)} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-white/5"><Printer size={13} /> Imprimir</button>
                                {doc.estado !== 'pagada' && <button onClick={() => marcarPagada(doc)} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#4ade95] hover:bg-white/5"><CheckCircle2 size={13} /> Marcar pagada</button>}
                                <button onClick={() => { setPendingDelete(doc); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-red-400 hover:bg-white/5"><Trash2 size={13} /> Eliminar</button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-5 py-10 text-center text-zinc-600">Todavía no hay documentos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="w-full border-t border-white/[0.07] py-3 text-center text-xs font-bold text-[#ff5468] hover:bg-white/[0.02]">Ver todas las facturas</button>
          </LabPanel>

          <LabPanel title="Crear nuevo documento">
            <div className="space-y-2.5">
              {quickDocs.map((d) => {
                const Icon = d.icon
                return (
                  <button key={d.tipo} onClick={() => crearDocumento(d.tipo)} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.05]">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c81f2a]/10 text-[#ff5468]`}><Icon size={18} /></div>
                    <div>
                      <div className="text-sm font-bold text-white">{d.label}</div>
                      <div className="text-[11px] text-zinc-500">{d.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </LabPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <LabPanel title="Ingresos" action={<span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-bold text-zinc-400">Este mes</span>}>
            <div className="mb-3">
              <div className="text-xl font-bold text-white">{money(facturadoMes)}</div>
              <div className="text-xs font-bold text-[#4ade95]">+22% vs mes anterior</div>
            </div>
            <div className="h-40"><LabLineChart points={ingresosAcumulado} labels={dayLabels} color="#ff3b46" formatY={(v) => `${Math.round(v / 1000)}k €`} /></div>
          </LabPanel>

          <LabPanel title="Cobros" action={<span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-bold text-zinc-400">Este mes</span>}>
            <div className="mb-3">
              <div className="text-xl font-bold text-white">{money(cobradas)}</div>
              <div className="text-xs font-bold text-[#4ade95]">+20% vs mes anterior</div>
            </div>
            <div className="mb-2 flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-400"><span className="h-2 w-2 rounded-full bg-[#4ade95]" /> Cobrados</span>
              <span className="flex items-center gap-1.5 font-semibold text-zinc-400"><span className="h-2 w-2 rounded-full bg-[#ffab52]" /> Pendientes</span>
            </div>
            <div className="h-32">
              <LabBarChart
                labels={dayLabels}
                series={[
                  { label: 'Cobrados', color: '#4ade95', values: cobradosPorDia },
                  { label: 'Pendientes', color: '#ffab52', values: pendientesPorDia },
                ]}
                formatY={(v) => `${Math.round(v / 1000)}k €`}
              />
            </div>
          </LabPanel>

          <LabPanel title="Estado de cobros">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <LabDonut
                size={140}
                thickness={18}
                centerValue={money(pendienteTotal)}
                centerLabel="Pendiente"
                segments={[
                  { label: 'Cobradas', value: cobradas, color: '#4ade95' },
                  { label: 'Pendientes', value: pendientesSinVencer, color: '#ffab52' },
                  { label: 'Vencidas', value: vencidas, color: '#ff5468' },
                ]}
              />
              <div className="min-w-0 flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4ade95]" /> <span className="text-zinc-400">Cobradas</span><span className="ml-auto font-bold text-zinc-200">{money(cobradas)}</span></div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ffab52]" /> <span className="text-zinc-400">Pendientes</span><span className="ml-auto font-bold text-zinc-200">{Math.round((pendientesSinVencer / totalCobros) * 100)}%</span></div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff5468]" /> <span className="text-zinc-400">Vencidas</span><span className="ml-auto font-bold text-zinc-200">{money(vencidas)}</span></div>
              </div>
            </div>
          </LabPanel>
        </div>
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title="Nuevo documento">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <select value={form.tipo_documento} onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}>
            <option value="factura">Factura</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="albaran">Albarán</option>
            <option value="ticket">Ticket</option>
          </select>
          <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
            <option value="">Sin cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <input type="number" placeholder="IVA %" value={form.iva_porcentaje} onChange={(e) => setForm({ ...form, iva_porcentaje: Number(e.target.value) })} />
          <input className="md:col-span-2" placeholder="Concepto primera línea" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
          <input type="number" placeholder="Precio primera línea" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
          <textarea className="md:col-span-2" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button className="rounded-xl bg-[#c81f2a] py-3 font-bold text-white hover:bg-[#e2242f] md:col-span-2">Crear documento</button>
        </form>
      </FormModal>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar ${pendingDelete?.numero_documento || 'este documento'}`}
        description="Esta acción eliminará también sus líneas de detalle. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </LabShell>
  )
}
