'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Package,
  AlertTriangle,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  SlidersHorizontal,
  Download,
  Settings2,
  Cpu,
  Pencil,
  Trash2,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import FormModal from '@/components/FormModal'
import ConfirmModal from '@/components/ConfirmModal'
import CustomSelect from '@/components/ak/CustomSelect'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'

const tiposStock = ['llave', 'ecu', 'bsi', 'bcm', 'cas', 'fem', 'bdc', 'ezs', 'elv', 'cuadro', 'accesorio', 'otro']
const TIPO_FILTRO_OPTIONS = [{ value: 'todos', label: 'Todas las categorías' }, ...tiposStock.map((t) => ({ value: t, label: t.toUpperCase() }))]

const emptyForm = { tipo: 'otro', referencia: '', descripcion: '', marca: '', modelo: '', cantidad: 0, cantidad_minima: 0, precio_compra: 0, precio_venta: 0, ubicacion: '', notas: '' }

function estadoStock(item: any) {
  const cant = Number(item.cantidad || 0)
  const min = Number(item.cantidad_minima || 0)
  if (cant <= 0 || (min > 0 && cant <= min * 0.5)) return { tone: 'red' as const, label: 'Crítico' }
  if (cant <= min) return { tone: 'amber' as const, label: 'Bajo stock' }
  return { tone: 'green' as const, label: 'OK' }
}

export default function StockPage() {
  const [items, setItems] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [query, setQuery] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [stockRes, movRes] = await Promise.all([
        supabase.from('stock').select('*').order('created_at', { ascending: false }),
        supabase.from('movimientos_stock').select('*, stock:stock_id(referencia,descripcion)').order('created_at', { ascending: false }).limit(8),
      ])
      if (stockRes.error) throw stockRes.error
      setItems(stockRes.data || [])
      setMovimientos(movRes.data || [])
      if ((stockRes.data || []).length && !selectedId) setSelectedId(stockRes.data![0].id)
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el stock')
    } finally {
      setLoading(false)
    }
  }

  const stockBajo = items.filter((i) => Number(i.cantidad || 0) <= Number(i.cantidad_minima || 0))
  const valorInventario = items.reduce((sum, i) => sum + Number(i.cantidad || 0) * Number(i.precio_venta || i.precio_compra || 0), 0)
  const entradasMes = movimientos.filter((m) => m.tipo_movimiento === 'entrada').reduce((a, m) => a + Number(m.cantidad || 0), 0)
  const salidasMes = movimientos.filter((m) => m.tipo_movimiento === 'salida').reduce((a, m) => a + Math.abs(Number(m.cantidad || 0)), 0)

  const filtered = useMemo(() => {
    let out = items
    if (tipoFiltro !== 'todos') out = out.filter((i) => (i.tipo || 'otro') === tipoFiltro)
    const q = query.toLowerCase().trim()
    if (!q) return out
    return out.filter((i) => `${i.tipo || ''} ${i.referencia || ''} ${i.descripcion || ''} ${i.marca || ''} ${i.modelo || ''} ${i.ubicacion || ''}`.toLowerCase().includes(q))
  }, [items, query, tipoFiltro])

  const selected = items.find((i) => i.id === selectedId) || null

  function newItem() { setEditing(null); setForm(emptyForm); setOpen(true) }
  function editItem(item: any) {
    setEditing(item)
    setForm({
      tipo: item.tipo || 'otro', referencia: item.referencia || '', descripcion: item.descripcion || '',
      marca: item.marca || '', modelo: item.modelo || '', cantidad: item.cantidad ?? 0, cantidad_minima: item.cantidad_minima ?? 0,
      precio_compra: item.precio_compra ?? 0, precio_venta: item.precio_venta ?? 0, ubicacion: item.ubicacion || '', notas: item.notas || '',
    })
    setOpen(true)
  }

  async function save(e: any) {
    e.preventDefault()
    if (!form.descripcion?.trim()) { toast.error('La descripción es obligatoria'); return }
    try {
      setSaving(true)
      const payload = {
        tipo: form.tipo || 'otro', referencia: form.referencia || null, descripcion: form.descripcion,
        marca: form.marca || null, modelo: form.modelo || null, cantidad: Number(form.cantidad || 0),
        cantidad_minima: Number(form.cantidad_minima || 0), precio_compra: Number(form.precio_compra || 0),
        precio_venta: Number(form.precio_venta || 0), ubicacion: form.ubicacion || null, notas: form.notas || null,
      }
      if (editing) {
        const { error } = await supabase.from('stock').update(payload).eq('id', editing.id)
        if (error) throw error
        await supabase.from('movimientos_stock').insert({ stock_id: editing.id, tipo_movimiento: 'ajuste', cantidad: payload.cantidad, motivo: 'Edición manual desde control de stock' })
        toast.success('Referencia actualizada')
      } else {
        const { error } = await supabase.from('stock').insert(payload)
        if (error) throw error
        toast.success('Referencia creada')
      }
      setOpen(false); setEditing(null); setForm(emptyForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const { error } = await supabase.from('stock').delete().eq('id', pendingDelete.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Referencia eliminada')
    setPendingDelete(null)
    if (selectedId === pendingDelete.id) setSelectedId(null)
    load()
  }

  const margen = selected && Number(selected.precio_venta) > 0
    ? ((Number(selected.precio_venta) - Number(selected.precio_compra || 0)) / Number(selected.precio_venta)) * 100
    : null
  const ultimaEntrada = movimientos.find((m) => m.stock_id === selected?.id && m.tipo_movimiento === 'entrada')
  const badgeSel = selected ? estadoStock(selected) : null

  return (
    <LabShell
      title="Stock"
      breadcrumb="Inventario / Gestión de stock"
      actions={
        <button onClick={newItem} className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
          <Package size={16} /> Nueva referencia
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <LabStatCard icon={<Boxes size={19} />} tone="red" label="Artículos totales" value={items.length.toLocaleString('es-ES')} trend={5.3} subtitle="vs. mes anterior" />
          <LabStatCard icon={<AlertTriangle size={19} />} tone="orange" label="Bajo stock" value={stockBajo.length} trend={-8.2} subtitle="Requieren reposición" />
          <LabStatCard icon={<Package size={19} />} tone="blue" label="Valor de inventario" value={money(valorInventario)} trend={6.7} subtitle="Valor total actual" />
          <LabStatCard icon={<ArrowDownToLine size={19} />} tone="green" label="Entradas (este mes)" value={entradasMes} trend={18.4} subtitle="Unidades recibidas" />
          <LabStatCard icon={<ArrowUpFromLine size={19} />} tone="purple" label="Salidas (este mes)" value={salidasMes} trend={14.1} subtitle="Unidades despachadas" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_360px]">
          <LabPanel padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] p-4">
              <CustomSelect className="w-48" value={tipoFiltro} onChange={setTipoFiltro} options={TIPO_FILTRO_OPTIONS} />
              <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por SKU, referencia o descripción..." className="w-full border-0 bg-transparent p-0 text-sm" />
              </div>
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><SlidersHorizontal size={14} /> Filtros</button>
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><Download size={14} /> Exportar</button>
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><Settings2 size={14} /> Ajustes de vista</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Categoría</th>
                    <th className="px-3 py-3 font-bold">SKU</th>
                    <th className="px-3 py-3 font-bold">Descripción</th>
                    <th className="px-3 py-3 font-bold">Ubicación</th>
                    <th className="px-3 py-3 font-bold text-right">Stock</th>
                    <th className="px-3 py-3 font-bold text-right">Mínimo</th>
                    <th className="px-3 py-3 font-bold text-right">Coste</th>
                    <th className="px-3 py-3 font-bold text-right">PVP</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-3 py-3 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const st = estadoStock(item)
                    return (
                      <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === item.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}>
                        <td className="px-5 py-3"><span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-bold uppercase text-zinc-400">{item.tipo || 'otro'}</span></td>
                        <td className="px-3 py-3 font-bold text-white">{item.referencia || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="text-zinc-200">{item.descripcion}</div>
                          <div className="text-[11px] text-zinc-600">{[item.marca, item.modelo].filter(Boolean).join(' ')}</div>
                        </td>
                        <td className="px-3 py-3 text-zinc-500">{item.ubicacion || '—'}</td>
                        <td className={`px-3 py-3 text-right font-bold ${Number(item.cantidad) <= Number(item.cantidad_minima) ? 'text-[#ff5468]' : 'text-zinc-200'}`}>{item.cantidad ?? 0}</td>
                        <td className="px-3 py-3 text-right text-zinc-500">{item.cantidad_minima ?? 0}</td>
                        <td className="px-3 py-3 text-right text-zinc-400">{money(item.precio_compra)}</td>
                        <td className="px-3 py-3 text-right text-zinc-200">{money(item.precio_venta)}</td>
                        <td className="px-3 py-3"><LabBadge tone={st.tone} dot>{st.label}</LabBadge></td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); editItem(item) }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><Pencil size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setPendingDelete(item) }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-zinc-600">Ninguna referencia coincide con estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </LabPanel>

          <LabPanel title="Detalle del artículo">
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona un artículo de la lista.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid h-28 place-items-center rounded-xl bg-white/[0.03] text-zinc-700"><Cpu size={44} strokeWidth={1.2} /></div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-bold uppercase text-zinc-400">{selected.tipo}</span>
                  {badgeSel && <LabBadge tone={badgeSel.tone}>{badgeSel.label === 'OK' ? 'En stock' : badgeSel.label}</LabBadge>}
                </div>
                <div>
                  <div className="text-base font-bold text-white">{selected.descripcion}</div>
                  <div className="text-xs text-zinc-500">{[selected.marca, selected.modelo].filter(Boolean).join(' ')}</div>
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">SKU</dt><dd className="font-bold text-zinc-200">{selected.referencia || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Ubicación</dt><dd className="font-bold text-zinc-200">{selected.ubicacion || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Stock actual</dt><dd className="font-bold text-zinc-200">{selected.cantidad ?? 0} unidades</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Stock mínimo</dt><dd className="font-bold text-zinc-200">{selected.cantidad_minima ?? 0} unidades</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Coste</dt><dd className="font-bold text-zinc-200">{money(selected.precio_compra)}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">PVP</dt><dd className="font-bold text-zinc-200">{money(selected.precio_venta)}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Margen</dt><dd className="font-bold text-[#4ade95]">{margen !== null ? `${margen.toFixed(1)}%` : '—'}</dd></div>
                  <div className="flex justify-between pb-1"><dt className="text-zinc-600">Última entrada</dt><dd className="font-bold text-zinc-200">{ultimaEntrada ? new Date(ultimaEntrada.created_at).toLocaleDateString('es-ES') : '—'}</dd></div>
                </dl>
                {selected.notas && (
                  <div>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas</div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">{selected.notas}</div>
                  </div>
                )}
              </div>
            )}
          </LabPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <LabPanel title="Alertas de reposición" action={<LabBadge tone="red">{stockBajo.length}</LabBadge>}>
            <div className="space-y-2">
              {stockBajo.slice(0, 5).map((item) => {
                const critico = Number(item.cantidad) <= Number(item.cantidad_minima) * 0.5
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{item.descripcion}</div>
                      <div className="text-[10px] text-zinc-600">SKU: {item.referencia || '—'} · {item.cantidad ?? 0}/{item.cantidad_minima ?? 0} uds</div>
                    </div>
                    <button className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold ${critico ? 'bg-[#c81f2a] text-white' : 'bg-[#ffab52]/20 text-[#ffab52]'}`}>
                      {critico ? 'Realizar pedido' : 'Programar pedido'}
                    </button>
                  </div>
                )
              })}
              {stockBajo.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin alertas de reposición.</div>}
            </div>
            {stockBajo.length > 5 && <button className="mt-3 w-full text-center text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver todas las alertas ({stockBajo.length})</button>}
          </LabPanel>

          <LabPanel title="Movimientos recientes">
            <div className="space-y-2">
              {movimientos.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <LabBadge tone={m.tipo_movimiento === 'entrada' ? 'green' : m.tipo_movimiento === 'salida' ? 'red' : 'blue'}>{m.tipo_movimiento}</LabBadge>
                      <span className="truncate font-semibold text-zinc-200">{m.stock?.descripcion || m.stock?.referencia || 'Referencia'}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-600">{new Date(m.created_at).toLocaleString('es-ES')} {m.motivo ? `· ${m.motivo}` : ''}</div>
                  </div>
                  <span className={`shrink-0 font-bold ${m.tipo_movimiento === 'salida' ? 'text-[#ff5468]' : 'text-[#4ade95]'}`}>
                    {m.tipo_movimiento === 'salida' ? '-' : '+'}{Math.abs(Number(m.cantidad || 0))}
                  </span>
                </div>
              ))}
              {movimientos.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin movimientos registrados.</div>}
            </div>
          </LabPanel>
        </div>
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar referencia' : 'Nueva referencia'}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {tiposStock.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input placeholder="Referencia" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
          <input required className="md:col-span-2" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <input placeholder="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
          <input placeholder="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
          <input type="number" placeholder="Cantidad" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
          <input type="number" placeholder="Cantidad mínima" value={form.cantidad_minima} onChange={(e) => setForm({ ...form, cantidad_minima: Number(e.target.value) })} />
          <input type="number" step="0.01" placeholder="Precio compra" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: Number(e.target.value) })} />
          <input type="number" step="0.01" placeholder="Precio venta" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })} />
          <input className="md:col-span-2" placeholder="Ubicación" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          <textarea className="md:col-span-2" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          <button disabled={saving} className="rounded-xl bg-[#c81f2a] py-3 font-bold text-white hover:bg-[#e2242f] disabled:opacity-50 md:col-span-2">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear referencia'}</button>
        </form>
      </FormModal>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar ${pendingDelete?.referencia || pendingDelete?.descripcion || 'esta referencia'}`}
        description="Se eliminará la referencia de stock definitivamente."
        confirmLabel="Sí, eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </LabShell>
  )
}
