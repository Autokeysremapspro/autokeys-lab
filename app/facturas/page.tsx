'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import FormModal from '@/components/FormModal'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  Eye,
  FileText,
  Pencil,
  PlusCircle,
  Printer,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'

type Documento = {
  id: string
  cliente_id?: string | null
  expediente_id?: string | null
  tipo_documento?: string | null
  numero_documento?: string | null
  fecha?: string | null
  subtotal?: number | null
  iva_porcentaje?: number | null
  iva_importe?: number | null
  total?: number | null
  estado?: string | null
  notas?: string | null
  created_at?: string
  clientes?: { nombre?: string | null } | null
}

const emptyForm = {
  tipo_documento: 'factura',
  cliente_id: '',
  estado: 'pendiente',
  iva_porcentaje: 21,
  notas: '',
  concepto: 'Servicio Autokeys Lab',
  precio: 0,
}

function docBadge(tipo?: string | null) {
  if (tipo === 'factura') return 'badge bg-red-600/20 text-red-300 border border-red-500/30'
  if (tipo === 'presupuesto') return 'badge bg-blue-600/20 text-blue-300 border border-blue-500/30'
  if (tipo === 'albaran') return 'badge bg-purple-600/20 text-purple-300 border border-purple-500/30'
  return 'badge bg-zinc-600/20 text-zinc-300 border border-zinc-500/30'
}

function estadoBadge(estado?: string | null) {
  if (estado === 'pagada') return 'badge bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
  if (estado === 'cancelada') return 'badge bg-zinc-600/20 text-zinc-400 border border-zinc-500/30'
  return 'badge bg-amber-600/20 text-amber-300 border border-amber-500/30'
}

function abrirDocumento(id: string, imprimir = false) {
  const url = imprimir ? `/api/documentos/${id}?print=1` : `/api/documentos/${id}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function FacturasPage() {
  const [items, setItems] = useState<Documento[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Documento | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [{ data: docs, error: docsError }, { data: cli, error: cliError }] = await Promise.all([
        supabase.from('facturas').select('*,clientes(nombre)').order('created_at', { ascending: false }),
        supabase.from('clientes').select('id,nombre').order('nombre'),
      ])
      if (docsError) throw docsError
      if (cliError) throw cliError
      setItems((docs || []) as Documento[])
      setClientes(cli || [])
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter(i => `${i.numero_documento || ''} ${i.tipo_documento || ''} ${i.clientes?.nombre || ''} ${i.estado || ''}`.toLowerCase().includes(q))
  }, [items, query])

  function nuevo() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function editar(doc: Documento) {
    setEditing(doc)
    setForm({
      tipo_documento: doc.tipo_documento || 'factura',
      cliente_id: doc.cliente_id || '',
      estado: doc.estado || 'pendiente',
      iva_porcentaje: doc.iva_porcentaje ?? 21,
      notas: doc.notas || '',
      concepto: 'Servicio Autokeys Lab',
      precio: 0,
    })
    setOpen(true)
  }

  async function save(e: any) {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase
          .from('facturas')
          .update({
            tipo_documento: form.tipo_documento,
            cliente_id: form.cliente_id || null,
            estado: form.estado,
            iva_porcentaje: Number(form.iva_porcentaje || 21),
            notas: form.notas || null,
          })
          .eq('id', editing.id)
        if (error) throw error
        toast.success('Documento actualizado')
      } else {
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
          const { error: lineError } = await supabase.from('lineas_factura').insert({
            factura_id: data.id,
            concepto: form.concepto || 'Servicio Autokeys Lab',
            cantidad: 1,
            precio_unitario: precio,
          })
          if (lineError) throw lineError
        }
        toast.success('Documento creado')
      }

      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'Error guardando documento')
    }
  }

  async function eliminar(doc: Documento) {
    if (!confirm(`¿Eliminar ${doc.numero_documento || 'este documento'}? Esta acción eliminará también sus líneas.`)) return
    try {
      const { error } = await supabase.from('facturas').delete().eq('id', doc.id)
      if (error) throw error
      toast.success('Documento eliminado')
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar')
    }
  }

  async function cambiarEstado(doc: Documento, estado: 'pendiente' | 'pagada' | 'cancelada') {
    try {
      const { error } = await supabase.from('facturas').update({ estado }).eq('id', doc.id)
      if (error) throw error
      toast.success(`Documento marcado como ${estado}`)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cambiar el estado')
    }
  }

  const totalPendiente = items.filter(i => i.estado !== 'pagada' && i.estado !== 'cancelada').reduce((sum, i) => sum + Number(i.total || 0), 0)
  const totalPagado = items.filter(i => i.estado === 'pagada').reduce((sum, i) => sum + Number(i.total || 0), 0)

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Administración</p>
          <h2 className="text-3xl font-black mt-1">Facturas / Presupuestos</h2>
          <p className="text-zinc-500 mt-2">Crea, edita, imprime y controla el estado de los documentos.</p>
        </div>
        <button onClick={nuevo} className="btn btn-red flex items-center gap-2 justify-center">
          <PlusCircle size={18} /> Nuevo documento
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5"><div className="text-zinc-500 text-sm">Documentos</div><div className="text-3xl font-black mt-2">{items.length}</div></div>
        <div className="card p-5"><div className="text-zinc-500 text-sm">Pendiente</div><div className="text-3xl font-black mt-2 text-amber-300">{money(totalPendiente)}</div></div>
        <div className="card p-5"><div className="text-zinc-500 text-sm">Pagado</div><div className="text-3xl font-black mt-2 text-emerald-300">{money(totalPagado)}</div></div>
        <div className="card p-5"><div className="text-zinc-500 text-sm">Facturas</div><div className="text-3xl font-black mt-2">{items.filter(i => i.tipo_documento === 'factura').length}</div></div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <FileText className="text-red-400" />
            <h3 className="text-xl font-black">Documentos</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 w-full md:w-96">
            <Search size={18} className="text-zinc-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar número, cliente, tipo..." className="bg-transparent border-0 p-0 w-full shadow-none" />
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 py-10 text-center">Cargando documentos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-zinc-500 py-10 text-center">No hay documentos todavía.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id}>
                    <td><b>{doc.numero_documento || 'Sin número'}</b></td>
                    <td><span className={docBadge(doc.tipo_documento)}>{doc.tipo_documento}</span></td>
                    <td>{doc.clientes?.nombre || <span className="text-zinc-600">Sin cliente</span>}</td>
                    <td className="text-zinc-400">{doc.fecha || '-'}</td>
                    <td><b>{money(doc.total)}</b></td>
                    <td><span className={estadoBadge(doc.estado)}>{doc.estado || 'pendiente'}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => abrirDocumento(doc.id)} className="btn btn-dark flex items-center gap-2"><Eye size={15} /> Ver PDF</button>
                        <button onClick={() => abrirDocumento(doc.id, true)} className="btn btn-dark flex items-center gap-2"><Printer size={15} /> Imprimir</button>
                        <button onClick={() => editar(doc)} className="btn btn-dark flex items-center gap-2"><Pencil size={15} /> Editar</button>
                        {doc.estado !== 'pagada' && <button onClick={() => cambiarEstado(doc, 'pagada')} className="btn bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 flex items-center gap-2"><CheckCircle2 size={15} /> Pagada</button>}
                        {doc.estado !== 'cancelada' && <button onClick={() => cambiarEstado(doc, 'cancelada')} className="btn bg-zinc-900 border border-white/10 text-zinc-300 flex items-center gap-2"><XCircle size={15} /> Cancelar</button>}
                        <button onClick={() => eliminar(doc)} className="btn bg-red-950/40 border border-red-500/20 text-red-300 flex items-center gap-2"><Trash2 size={15} /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar documento' : 'Nuevo documento'}>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <select value={form.tipo_documento} onChange={e => setForm({ ...form, tipo_documento: e.target.value })}>
            <option value="factura">Factura</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="albaran">Albarán</option>
            <option value="ticket">Ticket</option>
          </select>
          <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
            <option value="">Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <input type="number" placeholder="IVA %" value={form.iva_porcentaje} onChange={e => setForm({ ...form, iva_porcentaje: Number(e.target.value) })} />

          {!editing && (
            <>
              <input className="md:col-span-2" placeholder="Concepto primera línea" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} />
              <input type="number" placeholder="Precio primera línea" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} />
              <div className="text-sm text-zinc-500 flex items-center">Después podrás gestionar líneas desde la OT asociada.</div>
            </>
          )}

          <textarea className="md:col-span-2" placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
          <button className="btn btn-red md:col-span-2">{editing ? 'Guardar cambios' : 'Crear documento'}</button>
        </form>
      </FormModal>
    </AppShell>
  )
}
