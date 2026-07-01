'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, FilePlus2, Plus, ReceiptText, Save, Trash2 } from 'lucide-react'
import { FacturacionService } from '@/lib/services/facturacion'
import type { DocumentoFacturacion, ExpedienteConRelaciones, LineaFactura } from '@/types/autokeys'

type Props = {
  expediente: ExpedienteConRelaciones
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

const tipos = ['factura', 'presupuesto', 'albaran', 'ticket'] as const
const estados = ['pendiente', 'pagada', 'cancelada']

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function prettyTipo(tipo?: string | null) {
  if (!tipo) return 'Documento'
  return tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

function emptyLinea(facturaId: string): Partial<LineaFactura> {
  return { factura_id: facturaId, concepto: '', descripcion: '', cantidad: 1, precio_unitario: 0 }
}

export default function FacturacionPanel({ expediente, onEvent }: Props) {
  const [docs, setDocs] = useState<DocumentoFacturacion[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [newTipo, setNewTipo] = useState<(typeof tipos)[number]>('factura')
  const [draftLinea, setDraftLinea] = useState<Partial<LineaFactura> | null>(null)

  const active = useMemo(() => docs.find(d => d.id === activeId) || docs[0] || null, [docs, activeId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await FacturacionService.getByExpediente(expediente.id)
      setDocs(data)
      if (!activeId && data[0]) setActiveId(data[0].id)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la facturación')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [expediente.id])

  async function createDocumento() {
    setSaving(true); setError(''); setOk('')
    try {
      const doc = await FacturacionService.createDocumento({
        expediente_id: expediente.id,
        cliente_id: expediente.cliente_id,
        tipo_documento: newTipo,
        iva_porcentaje: newTipo === 'ticket' ? 21 : 21,
        notas: `Generado desde ${expediente.numero_ot || 'expediente'}`,
      })
      await FacturacionService.addLinea({
        factura_id: doc.id,
        concepto: expediente.tipo_trabajo || 'Servicio Autokeys Lab',
        descripcion: expediente.descripcion || null,
        cantidad: 1,
        precio_unitario: expediente.precio_final || expediente.precio_estimado || 0,
      })
      await onEvent?.('Documento creado', `${prettyTipo(newTipo)} creado desde la OT`)
      setOk(`${prettyTipo(newTipo)} creado`)
      setActiveId(doc.id)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el documento')
    } finally {
      setSaving(false)
    }
  }

  async function saveDocumento(doc: DocumentoFacturacion) {
    setSaving(true); setError(''); setOk('')
    try {
      await FacturacionService.updateDocumento(doc.id, doc)
      await onEvent?.('Documento actualizado', doc.numero_documento || doc.tipo_documento || '')
      setOk('Documento guardado')
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el documento')
    } finally {
      setSaving(false)
    }
  }

  async function addLinea() {
    if (!active || !draftLinea?.concepto) return
    setSaving(true); setError(''); setOk('')
    try {
      await FacturacionService.addLinea({
        factura_id: active.id,
        concepto: draftLinea.concepto || '',
        descripcion: draftLinea.descripcion || null,
        cantidad: Number(draftLinea.cantidad || 1),
        precio_unitario: Number(draftLinea.precio_unitario || 0),
      })
      setDraftLinea(emptyLinea(active.id))
      await onEvent?.('Línea añadida a documento', draftLinea.concepto || '')
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo añadir la línea')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLinea(linea: LineaFactura) {
    if (!confirm('¿Eliminar esta línea?')) return
    setSaving(true); setError(''); setOk('')
    try {
      await FacturacionService.deleteLinea(linea.id)
      await onEvent?.('Línea eliminada', linea.concepto)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar la línea')
    } finally {
      setSaving(false)
    }
  }

  function updateDocLocal(next: DocumentoFacturacion) {
    setDocs(prev => prev.map(d => d.id === next.id ? next : d))
  }

  if (loading) return <div className="card p-6 text-zinc-400">Cargando facturación...</div>

  return (
    <div className="grid xl:grid-cols-3 gap-5">
      <div className="card p-6 xl:col-span-1">
        <h3 className="text-2xl font-black mb-4 flex items-center gap-2"><ReceiptText className="text-red-300" /> Facturación</h3>
        <p className="text-zinc-400 text-sm mb-5">Genera factura, presupuesto, albarán o ticket directamente desde esta OT.</p>

        {(error || ok) && <div className={`rounded-2xl border p-3 mb-4 text-sm ${error ? 'text-red-300 border-red-500/30' : 'text-emerald-300 border-emerald-500/30'}`}>{error || ok}</div>}

        <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4 mb-5">
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase text-zinc-400">Nuevo documento</span>
            <select value={newTipo} onChange={e => setNewTipo(e.target.value as any)}>
              {tipos.map(t => <option key={t} value={t}>{prettyTipo(t)}</option>)}
            </select>
          </label>
          <button disabled={saving} onClick={createDocumento} className="btn btn-red w-full mt-4 inline-flex items-center justify-center gap-2"><FilePlus2 size={18} /> Crear</button>
        </div>

        <div className="space-y-2">
          {docs.map(doc => (
            <button key={doc.id} onClick={() => setActiveId(doc.id)} className={`w-full text-left rounded-2xl border p-4 transition ${active?.id === doc.id ? 'border-red-500/60 bg-red-500/10' : 'border-white/10 bg-[#0B1220] hover:border-white/20'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{doc.numero_documento || prettyTipo(doc.tipo_documento)}</p>
                  <p className="text-xs text-zinc-500 uppercase font-bold">{prettyTipo(doc.tipo_documento)} · {doc.estado || 'pendiente'}</p>
                </div>
                <p className="font-black text-red-200">{money(doc.total)}</p>
              </div>
            </button>
          ))}
          {!docs.length && <div className="text-zinc-500 text-sm">Aún no hay documentos.</div>}
        </div>
      </div>

      <div className="card p-6 xl:col-span-2">
        {!active ? (
          <div className="text-zinc-500">Crea el primer documento para esta OT.</div>
        ) : (
          <div>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Documento</p>
                <h3 className="text-3xl font-black mt-1">{active.numero_documento || prettyTipo(active.tipo_documento)}</h3>
                <p className="text-zinc-400 mt-1">{expediente.cliente?.nombre || 'Sin cliente'} · {expediente.numero_ot}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 min-w-[320px]">
                <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-3"><p className="text-xs text-zinc-500 font-bold uppercase">Base</p><p className="font-black">{money(active.subtotal)}</p></div>
                <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-3"><p className="text-xs text-zinc-500 font-bold uppercase">IVA</p><p className="font-black">{money(active.iva_importe)}</p></div>
                <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-3"><p className="text-xs text-zinc-500 font-bold uppercase">Total</p><p className="font-black text-red-200">{money(active.total)}</p></div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <label className="space-y-2"><span className="text-xs font-black uppercase text-zinc-400">Tipo</span><select value={active.tipo_documento || 'factura'} onChange={e => updateDocLocal({ ...active, tipo_documento: e.target.value })}>{tipos.map(t => <option key={t} value={t}>{prettyTipo(t)}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase text-zinc-400">Estado</span><select value={active.estado || 'pendiente'} onChange={e => updateDocLocal({ ...active, estado: e.target.value })}>{estados.map(e => <option key={e}>{e}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase text-zinc-400">IVA %</span><input type="number" value={active.iva_porcentaje || 21} onChange={e => updateDocLocal({ ...active, iva_porcentaje: Number(e.target.value) })} /></label>
              <button disabled={saving} onClick={() => saveDocumento(active)} className="btn btn-red self-end inline-flex items-center justify-center gap-2"><Save size={18} /> Guardar</button>
              <label className="space-y-2 md:col-span-4"><span className="text-xs font-black uppercase text-zinc-400">Notas</span><textarea value={active.notas || ''} onChange={e => updateDocLocal({ ...active, notas: e.target.value })} /></label>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden mb-5">
              <div className="grid grid-cols-12 gap-2 bg-[#0B1220] px-4 py-3 text-xs font-black uppercase text-zinc-500">
                <div className="col-span-5">Concepto</div>
                <div className="col-span-2">Cant.</div>
                <div className="col-span-2">Precio</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>
              {(active.lineas || []).map(linea => (
                <div key={linea.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/10 items-center text-sm">
                  <div className="col-span-5"><p className="font-bold">{linea.concepto}</p>{linea.descripcion && <p className="text-zinc-500 text-xs">{linea.descripcion}</p>}</div>
                  <div className="col-span-2 text-zinc-300">{linea.cantidad || 0}</div>
                  <div className="col-span-2 text-zinc-300">{money(linea.precio_unitario)}</div>
                  <div className="col-span-2 font-black">{money(linea.total)}</div>
                  <div className="col-span-1 text-right"><button onClick={() => deleteLinea(linea)} className="text-zinc-500 hover:text-red-300"><Trash2 size={18} /></button></div>
                </div>
              ))}
              {!active.lineas?.length && <div className="p-4 text-zinc-500 text-sm border-t border-white/10">Sin líneas.</div>}
            </div>

            <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4">
              <h4 className="font-black mb-3 flex items-center gap-2"><Plus size={18} className="text-red-300" /> Añadir línea</h4>
              <div className="grid md:grid-cols-12 gap-3">
                <input className="md:col-span-4" placeholder="Concepto" value={draftLinea?.concepto || ''} onChange={e => setDraftLinea({ ...(draftLinea || emptyLinea(active.id)), concepto: e.target.value })} />
                <input className="md:col-span-3" placeholder="Descripción" value={draftLinea?.descripcion || ''} onChange={e => setDraftLinea({ ...(draftLinea || emptyLinea(active.id)), descripcion: e.target.value })} />
                <input className="md:col-span-2" type="number" placeholder="Cantidad" value={draftLinea?.cantidad ?? 1} onChange={e => setDraftLinea({ ...(draftLinea || emptyLinea(active.id)), cantidad: Number(e.target.value) })} />
                <input className="md:col-span-2" type="number" placeholder="Precio" value={draftLinea?.precio_unitario ?? 0} onChange={e => setDraftLinea({ ...(draftLinea || emptyLinea(active.id)), precio_unitario: Number(e.target.value) })} />
                <button disabled={saving || !draftLinea?.concepto} onClick={addLinea} className="btn btn-red md:col-span-1 inline-flex justify-center"><Plus size={18} /></button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-100 flex gap-3">
              <CreditCard className="shrink-0" size={20} />
              <p>La generación de PDF profesional será el siguiente sprint. Esta versión deja los documentos y líneas guardados en Supabase y calcula totales con los triggers de la base de datos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
