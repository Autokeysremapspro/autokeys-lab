'use client'

import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { StockService } from '@/lib/services/stock'
import type { MovimientoStock, StockItem } from '@/types/autokeys'

type Props = {
  expedienteId: string
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

export default function MaterialPanel({ expedienteId, onEvent }: Props) {
  const [stock, setStock] = useState<StockItem[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([])
  const [query, setQuery] = useState('')
  const [stockId, setStockId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('Material usado en OT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [items, movs] = await Promise.all([
        StockService.getAll(),
        StockService.getMovimientosByExpediente(expedienteId),
      ])
      setStock(items)
      setMovimientos(movs)
      if (!stockId && items[0]) setStockId(items[0].id)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el material')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [expedienteId])

  const filteredStock = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return stock
    return stock.filter(item => [
      item.tipo,
      item.referencia,
      item.descripcion,
      item.marca,
      item.modelo,
      item.ubicacion,
    ].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [query, stock])

  const selected = stock.find(item => item.id === stockId)

  async function addSalida() {
    if (!stockId) return setError('Selecciona un material del stock')
    if (!cantidad || cantidad <= 0) return setError('La cantidad debe ser mayor que 0')
    setSaving(true)
    setError('')
    try {
      await StockService.addMovimiento({
        stock_id: stockId,
        expediente_id: expedienteId,
        tipo_movimiento: 'salida',
        cantidad,
        motivo,
      })
      await onEvent?.('Material añadido a OT', `${cantidad} x ${selected?.descripcion || stockId}`)
      setCantidad(1)
      setMotivo('Material usado en OT')
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo añadir el material')
    } finally {
      setSaving(false)
    }
  }

  const totalEstimado = movimientos.reduce((acc, mov) => {
    const item = stock.find(s => s.id === mov.stock_id)
    const precio = item?.precio_venta || 0
    return acc + ((mov.tipo_movimiento === 'salida' ? 1 : -1) * (mov.cantidad || 0) * precio)
  }, 0)

  return (
    <div className="grid xl:grid-cols-3 gap-5">
      <div className="card p-6 xl:col-span-2">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-2"><Package className="text-red-300" /> Material utilizado</h3>
            <p className="text-zinc-400 mt-1">Asocia llaves, ECUs, módulos, carcasas o consumibles del stock a esta OT.</p>
          </div>
          <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCcw size={17} /> Actualizar</button>
        </div>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 p-4 mb-5">{error}</div>}

        <div className="grid md:grid-cols-4 gap-3 mb-5">
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-3 top-3.5 text-zinc-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} className="pl-10" placeholder="Buscar referencia, ECU, llave, ubicación..." />
          </div>
          <select value={stockId} onChange={e => setStockId(e.target.value)} className="md:col-span-2">
            {filteredStock.map(item => (
              <option key={item.id} value={item.id}>{item.descripcion} · {item.referencia || 'sin ref'} · stock {item.cantidad ?? 0}</option>
            ))}
          </select>
          <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} placeholder="Cantidad" />
          <input value={motivo} onChange={e => setMotivo(e.target.value)} className="md:col-span-2" placeholder="Motivo" />
          <button disabled={saving || !stockId} onClick={addSalida} className="btn btn-red inline-flex items-center justify-center gap-2"><Plus size={18} /> {saving ? 'Añadiendo...' : 'Añadir salida'}</button>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-zinc-500">Cargando material...</div>}
          {!loading && movimientos.map(mov => {
            const item = stock.find(s => s.id === mov.stock_id)
            return (
              <div key={mov.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{item?.descripcion || 'Material'}</p>
                    <p className="text-sm text-zinc-400">{item?.referencia || 'Sin referencia'} · {item?.tipo || 'stock'} · {item?.ubicacion || 'sin ubicación'}</p>
                    <p className="text-xs text-zinc-600 mt-1">{formatDate(mov.created_at)} · {mov.motivo || 'Sin motivo'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${mov.tipo_movimiento === 'salida' ? 'text-red-300' : 'text-emerald-300'}`}>{mov.tipo_movimiento === 'salida' ? '-' : '+'}{mov.cantidad}</p>
                    <p className="text-sm text-zinc-500">{money((item?.precio_venta || 0) * (mov.cantidad || 0))}</p>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && movimientos.length === 0 && <div className="text-zinc-500">Aún no hay material asociado a esta OT.</div>}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-2xl font-black mb-5">Resumen</h3>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4">
            <p className="text-xs text-zinc-500 font-black uppercase">Movimientos</p>
            <p className="text-3xl font-black">{movimientos.length}</p>
          </div>
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4">
            <p className="text-xs text-zinc-500 font-black uppercase">Valor estimado usado</p>
            <p className="text-3xl font-black">{money(totalEstimado)}</p>
          </div>
          <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4">
            <p className="text-xs text-zinc-500 font-black uppercase">Seleccionado</p>
            <p className="font-black mt-1">{selected?.descripcion || 'Sin selección'}</p>
            <p className="text-sm text-zinc-400">Stock actual: {selected?.cantidad ?? '-'}</p>
            {selected && (selected.cantidad || 0) <= (selected.cantidad_minima || 0) && <p className="text-sm text-amber-300 mt-2">⚠ Stock bajo o en mínimo</p>}
          </div>
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-100">
            Cuando añades una salida, el stock baja automáticamente mediante el trigger de Supabase.
          </div>
        </div>
      </div>
    </div>
  )
}
