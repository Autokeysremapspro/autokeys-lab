'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import FormModal from '@/components/FormModal'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'
import toast from 'react-hot-toast'
import { Package, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react'

const tiposStock = ['llave','ecu','bsi','bcm','cas','fem','bdc','ezs','elv','cuadro','accesorio','otro']

const emptyForm = {
  tipo: 'otro',
  referencia: '',
  descripcion: '',
  marca: '',
  modelo: '',
  cantidad: 0,
  cantidad_minima: 0,
  precio_compra: 0,
  precio_venta: 0,
  ubicacion: '',
  notas: '',
}

export default function StockPage() {
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el stock')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter(i =>
      `${i.tipo || ''} ${i.referencia || ''} ${i.descripcion || ''} ${i.marca || ''} ${i.modelo || ''} ${i.ubicacion || ''}`.toLowerCase().includes(q)
    )
  }, [items, query])

  function newItem() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function editItem(item: any) {
    setEditing(item)
    setForm({
      tipo: item.tipo || 'otro',
      referencia: item.referencia || '',
      descripcion: item.descripcion || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      cantidad: item.cantidad ?? 0,
      cantidad_minima: item.cantidad_minima ?? 0,
      precio_compra: item.precio_compra ?? 0,
      precio_venta: item.precio_venta ?? 0,
      ubicacion: item.ubicacion || '',
      notas: item.notas || '',
    })
    setOpen(true)
  }

  async function save(e: any) {
    e.preventDefault()
    try {
      setSaving(true)
      if (!form.descripcion?.trim()) {
        toast.error('La descripción es obligatoria')
        return
      }

      const payload = {
        tipo: form.tipo || 'otro',
        referencia: form.referencia || null,
        descripcion: form.descripcion,
        marca: form.marca || null,
        modelo: form.modelo || null,
        cantidad: Number(form.cantidad || 0),
        cantidad_minima: Number(form.cantidad_minima || 0),
        precio_compra: Number(form.precio_compra || 0),
        precio_venta: Number(form.precio_venta || 0),
        ubicacion: form.ubicacion || null,
        notas: form.notas || null,
      }

      if (editing) {
        const { error } = await supabase.from('stock').update(payload).eq('id', editing.id)
        if (error) throw error
        await supabase.from('movimientos_stock').insert({
          stock_id: editing.id,
          tipo_movimiento: 'ajuste',
          cantidad: payload.cantidad,
          motivo: 'Edición manual desde control de stock',
        })
        toast.success('Referencia actualizada')
      } else {
        const { error } = await supabase.from('stock').insert(payload)
        if (error) throw error
        toast.success('Referencia creada')
      }

      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: any) {
    if (!confirm(`¿Eliminar la referencia ${item.referencia || item.descripcion}?`)) return
    try {
      const { error } = await supabase.from('stock').delete().eq('id', item.id)
      if (error) throw error
      toast.success('Referencia eliminada')
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar')
    }
  }

  const stockBajo = items.filter(i => Number(i.cantidad || 0) <= Number(i.cantidad_minima || 0)).length
  const valorStock = items.reduce((sum, i) => sum + Number(i.cantidad || 0) * Number(i.precio_compra || 0), 0)

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Almacén</p>
          <h2 className="text-3xl font-black mt-1">Control de stock</h2>
          <p className="text-zinc-500 mt-2">Edita, elimina y controla referencias de llaves, ECUs, módulos y accesorios.</p>
        </div>
        <button onClick={newItem} className="btn btn-red flex items-center gap-2 justify-center">
          <PlusCircle size={18} /> Nueva referencia
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <Package className="text-red-400" />
          <div className="text-3xl font-black mt-3">{items.length}</div>
          <div className="text-sm text-zinc-500">Referencias</div>
        </div>
        <div className="card p-5">
          <Package className="text-amber-300" />
          <div className="text-3xl font-black mt-3">{stockBajo}</div>
          <div className="text-sm text-zinc-500">Stock bajo</div>
        </div>
        <div className="card p-5">
          <Package className="text-emerald-300" />
          <div className="text-3xl font-black mt-3">{money(valorStock)}</div>
          <div className="text-sm text-zinc-500">Valor compra estimado</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Search className="text-red-400" />
            <h3 className="text-xl font-black">Referencias</h3>
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por referencia, descripción, marca o ubicación..."
            className="w-full md:w-96"
          />
        </div>

        {loading ? (
          <div className="text-zinc-500 py-10 text-center">Cargando stock...</div>
        ) : filtered.length === 0 ? (
          <div className="text-zinc-500 py-10 text-center">No hay referencias de stock.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Referencia</th>
                  <th>Descripción</th>
                  <th>Marca/Modelo</th>
                  <th>Cantidad</th>
                  <th>Compra</th>
                  <th>Venta</th>
                  <th>Ubicación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td><span className="badge bg-white/5 text-zinc-300">{item.tipo || 'otro'}</span></td>
                    <td><b>{item.referencia || '—'}</b></td>
                    <td>{item.descripcion}</td>
                    <td className="text-zinc-400">{`${item.marca || ''} ${item.modelo || ''}`.trim() || '—'}</td>
                    <td>
                      <span className={Number(item.cantidad || 0) <= Number(item.cantidad_minima || 0) ? 'text-red-300 font-black' : 'font-black'}>
                        {item.cantidad ?? 0}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">/ min {item.cantidad_minima ?? 0}</span>
                    </td>
                    <td>{money(item.precio_compra || 0)}</td>
                    <td>{money(item.precio_venta || 0)}</td>
                    <td className="text-zinc-400">{item.ubicacion || '—'}</td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => editItem(item)} className="btn btn-dark flex items-center gap-2"><Pencil size={15} /> Editar</button>
                        <button onClick={() => remove(item)} className="btn bg-red-950/40 border border-red-500/20 text-red-300 flex items-center gap-2"><Trash2 size={15} /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar referencia' : 'Nueva referencia'}>
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
            {tiposStock.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <input placeholder="Referencia" value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} />
          <input required className="md:col-span-2" placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          <input placeholder="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
          <input placeholder="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
          <input type="number" placeholder="Cantidad" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} />
          <input type="number" placeholder="Cantidad mínima" value={form.cantidad_minima} onChange={e => setForm({ ...form, cantidad_minima: Number(e.target.value) })} />
          <input type="number" step="0.01" placeholder="Precio compra" value={form.precio_compra} onChange={e => setForm({ ...form, precio_compra: Number(e.target.value) })} />
          <input type="number" step="0.01" placeholder="Precio venta" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: Number(e.target.value) })} />
          <input className="md:col-span-2" placeholder="Ubicación" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
          <textarea className="md:col-span-2" placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
          <button disabled={saving} className="btn btn-red md:col-span-2 disabled:opacity-50">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear referencia'}</button>
        </form>
      </FormModal>
    </AppShell>
  )
}
