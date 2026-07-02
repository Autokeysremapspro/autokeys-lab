'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import FormModal from '@/components/FormModal'
import { money } from '@/lib/status'
import {
  METODOS_PAGO,
  eliminarPago,
  getFacturasCobro,
  registrarPago,
  resumenCobros,
} from '@/lib/services/pagos'
import type { FacturaCobro } from '@/types/pagos'
import toast from 'react-hot-toast'
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'

function estadoBadge(factura: FacturaCobro) {
  if (factura.estado === 'cancelada') return 'badge bg-zinc-600/20 text-zinc-400 border border-zinc-500/30'
  if (Number(factura.pendiente || 0) <= 0 && Number(factura.total || 0) > 0) return 'badge bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
  if (Number(factura.total_pagado || 0) > 0) return 'badge bg-blue-600/20 text-blue-300 border border-blue-500/30'
  return 'badge bg-amber-600/20 text-amber-300 border border-amber-500/30'
}

function estadoTexto(factura: FacturaCobro) {
  if (factura.estado === 'cancelada') return 'cancelada'
  if (Number(factura.pendiente || 0) <= 0 && Number(factura.total || 0) > 0) return 'pagada'
  if (Number(factura.total_pagado || 0) > 0) return 'parcial'
  return 'pendiente'
}

function abrirDocumento(id: string) {
  window.open(`/api/documentos/${id}`, '_blank', 'noopener,noreferrer')
}

const initialForm = {
  factura_id: '',
  importe: 0,
  metodo_pago: 'efectivo',
  fecha_pago: new Date().toISOString().slice(0, 10),
  referencia: '',
  notas: '',
}

export default function PagosPage() {
  const [facturas, setFacturas] = useState<FacturaCobro[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<any>(initialForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setFacturas(await getFacturasCobro())
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los cobros')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return facturas
    return facturas.filter((f) =>
      `${f.numero_documento || ''} ${f.tipo_documento || ''} ${f.cliente_nombre || ''} ${f.estado || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [facturas, query])

  const resumen = useMemo(() => resumenCobros(facturas), [facturas])

  function nuevoPago(factura?: FacturaCobro) {
    const pendiente = Number(factura?.pendiente || factura?.total || 0)
    setForm({
      ...initialForm,
      factura_id: factura?.id || '',
      importe: pendiente > 0 ? pendiente : 0,
      fecha_pago: new Date().toISOString().slice(0, 10),
    })
    setOpen(true)
  }

  async function guardarPago(e: any) {
    e.preventDefault()

    if (!form.factura_id) {
      toast.error('Selecciona una factura')
      return
    }

    if (Number(form.importe || 0) <= 0) {
      toast.error('El importe debe ser mayor que 0')
      return
    }

    try {
      setSaving(true)
      await registrarPago({
        factura_id: form.factura_id,
        importe: Number(form.importe || 0),
        metodo_pago: form.metodo_pago,
        fecha_pago: form.fecha_pago,
        referencia: form.referencia,
        notas: form.notas,
      })
      toast.success('Pago registrado')
      setOpen(false)
      setForm(initialForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  async function borrarPago(id: string) {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await eliminarPago(id)
      toast.success('Pago eliminado')
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar el pago')
    }
  }

  const facturasConPendiente = facturas.filter((f) => Number(f.pendiente || 0) > 0 && f.estado !== 'cancelada')

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Administración</p>
          <h2 className="text-3xl font-black mt-1">Cobros / Pagos</h2>
          <p className="text-zinc-500 mt-2">Control de pagos parciales, facturas pendientes y métodos de cobro.</p>
        </div>
        <button onClick={() => nuevoPago()} className="btn btn-red flex items-center gap-2 justify-center">
          <PlusCircle size={18} /> Registrar pago
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-bold uppercase tracking-wider">Facturado</span>
            <Banknote size={20} />
          </div>
          <div className="text-2xl font-black mt-3">{money(resumen.totalFacturado)}</div>
        </div>
        <div className="card p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-sm font-bold uppercase tracking-wider">Cobrado</span>
            <CheckCircle2 size={20} />
          </div>
          <div className="text-2xl font-black mt-3 text-emerald-300">{money(resumen.totalCobrado)}</div>
        </div>
        <div className="card p-5 border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-sm font-bold uppercase tracking-wider">Pendiente</span>
            <Wallet size={20} />
          </div>
          <div className="text-2xl font-black mt-3 text-amber-300">{money(resumen.totalPendiente)}</div>
        </div>
        <div className="card p-5">
          <div className="text-zinc-500 text-sm">Facturas pendientes</div>
          <div className="text-3xl font-black mt-2">{resumen.facturasPendientes}</div>
        </div>
        <div className="card p-5">
          <div className="text-zinc-500 text-sm">Facturas pagadas</div>
          <div className="text-3xl font-black mt-2">{resumen.facturasPagadas}</div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <CreditCard className="text-red-400" />
            <h3 className="text-xl font-black">Estado de cobros</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 w-full md:w-96">
            <Search size={18} className="text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar número, cliente, estado..."
              className="bg-transparent border-0 p-0 w-full shadow-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 py-10 text-center flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Cargando cobros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-zinc-500 py-10 text-center">No hay documentos para mostrar.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Cobrado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((factura) => (
                  <tr key={factura.id}>
                    <td>
                      <b>{factura.numero_documento || 'Sin número'}</b>
                      <div className="text-xs text-zinc-500 uppercase mt-1">{factura.tipo_documento || 'documento'}</div>
                    </td>
                    <td>{factura.cliente_nombre || <span className="text-zinc-600">Sin cliente</span>}</td>
                    <td><b>{money(factura.total)}</b></td>
                    <td className="text-emerald-300 font-bold">{money(factura.total_pagado)}</td>
                    <td className="text-amber-300 font-bold">{money(factura.pendiente)}</td>
                    <td><span className={estadoBadge(factura)}>{estadoTexto(factura)}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => nuevoPago(factura)} className="btn btn-red flex items-center gap-2">
                          <PlusCircle size={15} /> Pago
                        </button>
                        <button onClick={() => abrirDocumento(factura.id)} className="btn btn-dark flex items-center gap-2">
                          <Eye size={15} /> Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <section className="card p-6">
          <h3 className="text-xl font-black mb-4">Pagos registrados</h3>
          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {facturas.flatMap((f) => (f.pagos || []).map((p) => ({ pago: p, factura: f }))).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">Todavía no hay pagos registrados.</div>
            ) : (
              facturas
                .flatMap((f) => (f.pagos || []).map((p) => ({ pago: p, factura: f })))
                .map(({ pago, factura }) => (
                  <div key={pago.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-black text-lg">{money(pago.importe)}</div>
                      <div className="text-sm text-zinc-400 mt-1">{factura.numero_documento || 'Sin número'} · {factura.cliente_nombre || 'Sin cliente'}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase">{pago.metodo_pago} · {pago.fecha_pago}</div>
                      {pago.referencia && <div className="text-xs text-zinc-500 mt-1">Ref: {pago.referencia}</div>}
                    </div>
                    <button onClick={() => borrarPago(pago.id)} className="btn bg-red-950/40 border border-red-500/20 text-red-300 flex items-center gap-2">
                      <Trash2 size={15} /> Eliminar
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="card p-6">
          <h3 className="text-xl font-black mb-4">Pendientes de cobro</h3>
          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {facturasConPendiente.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">No hay facturas pendientes.</div>
            ) : (
              facturasConPendiente.map((factura) => (
                <div key={factura.id} className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-black">{factura.numero_documento || 'Sin número'}</div>
                    <div className="text-sm text-zinc-400 mt-1">{factura.cliente_nombre || 'Sin cliente'}</div>
                    <div className="text-lg text-amber-300 font-black mt-2">Pendiente: {money(factura.pendiente)}</div>
                  </div>
                  <button onClick={() => nuevoPago(factura)} className="btn btn-red flex items-center gap-2">
                    <Download size={15} /> Cobrar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title="Registrar pago">
        <form onSubmit={guardarPago} className="grid md:grid-cols-2 gap-3">
          <select value={form.factura_id} onChange={(e) => setForm({ ...form, factura_id: e.target.value })} className="md:col-span-2">
            <option value="">Seleccionar factura</option>
            {facturas.map((factura) => (
              <option key={factura.id} value={factura.id}>
                {factura.numero_documento || 'Sin número'} · {factura.cliente_nombre || 'Sin cliente'} · pendiente {money(factura.pendiente)}
              </option>
            ))}
          </select>

          <input type="number" step="0.01" placeholder="Importe" value={form.importe} onChange={(e) => setForm({ ...form, importe: Number(e.target.value) })} />

          <select value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}>
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
            ))}
          </select>

          <input type="date" value={form.fecha_pago} onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })} />
          <input placeholder="Referencia / operación" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
          <textarea className="md:col-span-2" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />

          <button disabled={saving} className="btn btn-red md:col-span-2 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="animate-spin" size={18} />}
            Guardar pago
          </button>
        </form>
      </FormModal>
    </AppShell>
  )
}
