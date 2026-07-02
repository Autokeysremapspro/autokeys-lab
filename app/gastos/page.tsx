'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import { money } from '@/lib/status'
import {
  CATEGORIAS_GASTO,
  ESTADOS_GASTO,
  METODOS_PAGO_GASTO,
  actualizarGasto,
  crearGasto,
  eliminarGasto,
  gastoCategoriaLabel,
  getGastos,
  getIngresosMesActual,
  resumenGastos,
} from '@/lib/services/gastos'
import type { Gasto, GastoInput } from '@/types/gastos'
import toast from 'react-hot-toast'
import {
  Banknote,
  CalendarDays,
  Edit3,
  Loader2,
  PlusCircle,
  ReceiptText,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'

const emptyForm: GastoInput = {
  fecha: new Date().toISOString().slice(0, 10),
  concepto: '',
  categoria: 'otros',
  proveedor: '',
  factura_numero: '',
  base_imponible: 0,
  iva_porcentaje: 21,
  metodo_pago: 'transferencia',
  estado: 'pagado',
  notas: '',
  adjunto_url: '',
}

function estadoBadge(estado?: string | null) {
  if (estado === 'pagado') return 'badge bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
  if (estado === 'pendiente') return 'badge bg-amber-600/20 text-amber-300 border border-amber-500/30'
  if (estado === 'cancelado') return 'badge bg-zinc-600/20 text-zinc-400 border border-zinc-500/30'
  return 'badge bg-blue-600/20 text-blue-300 border border-blue-500/30'
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES').format(new Date(date))
}

function GastoModal({
  open,
  editing,
  form,
  saving,
  onClose,
  onSubmit,
  setForm,
}: {
  open: boolean
  editing: Gasto | null
  form: GastoInput
  saving: boolean
  onClose: () => void
  onSubmit: (e: any) => void
  setForm: (value: GastoInput) => void
}) {
  if (!open) return null

  const base = Number(form.base_imponible || 0)
  const iva = Number(form.iva_porcentaje || 0)
  const ivaImporte = Number(((base * iva) / 100).toFixed(2))
  const total = Number((base + ivaImporte).toFixed(2))

  function update(key: keyof GastoInput, value: any) {
    setForm({ ...form, [key]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-5xl p-6 max-h-[92vh] overflow-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Gastos / Compras</p>
            <h2 className="text-2xl font-black mt-1">{editing ? 'Editar gasto' : 'Nuevo gasto'}</h2>
            <p className="text-zinc-500 mt-1">Registra compras, herramientas, licencias y gastos fijos del negocio.</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-dark flex items-center gap-2">
            <X size={18} /> Cerrar
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Concepto *</span>
            <input required value={form.concepto} onChange={(e) => update('concepto', e.target.value)} placeholder="Ej: Licencia WinOLS, compra llaves BMW, luz local..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Fecha</span>
            <input type="date" value={form.fecha || ''} onChange={(e) => update('fecha', e.target.value)} className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Categoría</span>
            <select value={form.categoria} onChange={(e) => update('categoria', e.target.value)} className="w-full">
              {CATEGORIAS_GASTO.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Proveedor</span>
            <input value={form.proveedor || ''} onChange={(e) => update('proveedor', e.target.value)} placeholder="Proveedor / empresa" className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Nº factura / referencia</span>
            <input value={form.factura_numero || ''} onChange={(e) => update('factura_numero', e.target.value)} placeholder="Factura, recibo, pedido..." className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Base imponible</span>
            <input type="number" step="0.01" min="0" value={form.base_imponible} onChange={(e) => update('base_imponible', Number(e.target.value || 0))} className="w-full" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">IVA %</span>
            <input type="number" step="0.01" min="0" value={form.iva_porcentaje} onChange={(e) => update('iva_porcentaje', Number(e.target.value || 0))} className="w-full" />
          </label>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-zinc-500 text-sm">IVA soportado</div>
            <div className="text-2xl font-black mt-1 text-blue-300">{money(ivaImporte)}</div>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-5">
            <div className="text-zinc-500 text-sm">Total gasto</div>
            <div className="text-2xl font-black mt-1 text-red-300">{money(total)}</div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Método de pago</span>
            <select value={form.metodo_pago} onChange={(e) => update('metodo_pago', e.target.value)} className="w-full">
              {METODOS_PAGO_GASTO.map((metodo) => (
                <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-zinc-300">Estado</span>
            <select value={form.estado} onChange={(e) => update('estado', e.target.value)} className="w-full">
              {ESTADOS_GASTO.map((estado) => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">URL adjunto / factura</span>
            <input value={form.adjunto_url || ''} onChange={(e) => update('adjunto_url', e.target.value)} placeholder="Opcional: enlace a factura o recibo" className="w-full" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-zinc-300">Notas</span>
            <textarea value={form.notas || ''} onChange={(e) => update('notas', e.target.value)} placeholder="Observaciones internas..." className="w-full min-h-[110px]" />
          </label>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" onClick={onClose} className="btn btn-dark">Cancelar</button>
            <button disabled={saving} className="btn btn-red disabled:opacity-50">
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [ingresosMes, setIngresosMes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Gasto | null>(null)
  const [form, setForm] = useState<GastoInput>(emptyForm)
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('todas')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const [gastosData, ingresos] = await Promise.all([getGastos(), getIngresosMesActual()])
      setGastos(gastosData)
      setIngresosMes(ingresos)
    } catch (error: any) {
      toast.error(error.message || 'No se pudieron cargar los gastos')
    } finally {
      setLoading(false)
    }
  }

  const resumen = useMemo(() => resumenGastos(gastos, ingresosMes), [gastos, ingresosMes])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return gastos.filter((gasto) => {
      const matchesQuery = !q || `${gasto.concepto || ''} ${gasto.proveedor || ''} ${gasto.factura_numero || ''} ${gasto.categoria || ''} ${gasto.estado || ''}`.toLowerCase().includes(q)
      const matchesCategoria = categoria === 'todas' || gasto.categoria === categoria
      return matchesQuery && matchesCategoria
    })
  }, [gastos, query, categoria])

  function nuevoGasto() {
    setEditing(null)
    setForm({ ...emptyForm, fecha: new Date().toISOString().slice(0, 10) })
    setOpen(true)
  }

  function editarGasto(gasto: Gasto) {
    setEditing(gasto)
    setForm({
      fecha: gasto.fecha || new Date().toISOString().slice(0, 10),
      concepto: gasto.concepto || '',
      categoria: gasto.categoria || 'otros',
      proveedor: gasto.proveedor || '',
      factura_numero: gasto.factura_numero || '',
      base_imponible: Number(gasto.base_imponible || 0),
      iva_porcentaje: Number(gasto.iva_porcentaje || 21),
      metodo_pago: gasto.metodo_pago || 'transferencia',
      estado: gasto.estado || 'pagado',
      notas: gasto.notas || '',
      adjunto_url: gasto.adjunto_url || '',
    })
    setOpen(true)
  }

  async function guardar(e: any) {
    e.preventDefault()

    if (!form.concepto?.trim()) {
      toast.error('El concepto es obligatorio')
      return
    }

    try {
      setSaving(true)
      if (editing) {
        await actualizarGasto(editing.id, form)
        toast.success('Gasto actualizado')
      } else {
        await crearGasto(form)
        toast.success('Gasto registrado')
      }
      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el gasto')
    } finally {
      setSaving(false)
    }
  }

  async function borrar(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await eliminarGasto(id)
      toast.success('Gasto eliminado')
      await load()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo eliminar el gasto')
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Finanzas</p>
          <h2 className="text-3xl font-black mt-1">Gastos / Compras</h2>
          <p className="text-zinc-500 mt-2">Controla compras, licencias, herramientas, gastos fijos e IVA soportado.</p>
        </div>
        <button onClick={nuevoGasto} className="btn btn-red flex items-center gap-2 justify-center">
          <PlusCircle size={18} /> Nuevo gasto
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 border border-red-500/20">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-sm font-bold uppercase tracking-wider">Gastos mes</span>
            <TrendingDown size={20} />
          </div>
          <div className="text-2xl font-black mt-3 text-red-300">{money(resumen.totalMes)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-bold uppercase tracking-wider">Gastos año</span>
            <CalendarDays size={20} />
          </div>
          <div className="text-2xl font-black mt-3">{money(resumen.totalAnio)}</div>
        </div>
        <div className="card p-5 border border-blue-500/20">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-sm font-bold uppercase tracking-wider">IVA soportado</span>
            <ReceiptText size={20} />
          </div>
          <div className="text-2xl font-black mt-3 text-blue-300">{money(resumen.ivaSoportadoMes)}</div>
        </div>
        <div className="card p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-sm font-bold uppercase tracking-wider">Ingresos mes</span>
            <TrendingUp size={20} />
          </div>
          <div className="text-2xl font-black mt-3 text-emerald-300">{money(ingresosMes)}</div>
        </div>
        <div className="card p-5 border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-sm font-bold uppercase tracking-wider">Beneficio bruto</span>
            <Wallet size={20} />
          </div>
          <div className={`text-2xl font-black mt-3 ${resumen.beneficioMes >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{money(resumen.beneficioMes)}</div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Banknote className="text-red-400" />
            <h3 className="text-xl font-black">Listado de gastos</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 w-full md:w-96">
              <Search size={18} className="text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar concepto, proveedor, factura..."
                className="bg-transparent border-0 p-0 w-full shadow-none"
              />
            </div>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full md:w-64">
              <option value="todas">Todas las categorías</option>
              {CATEGORIAS_GASTO.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-zinc-500 py-10 text-center flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Cargando gastos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-zinc-500 py-10 text-center">No hay gastos registrados.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Proveedor</th>
                  <th>Base</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((gasto) => (
                  <tr key={gasto.id}>
                    <td className="whitespace-nowrap">{formatDate(gasto.fecha)}</td>
                    <td>
                      <b>{gasto.concepto}</b>
                      <div className="text-xs text-zinc-500 mt-1">{gasto.factura_numero || 'Sin referencia'}</div>
                    </td>
                    <td>{gastoCategoriaLabel(gasto.categoria)}</td>
                    <td>{gasto.proveedor || <span className="text-zinc-600">—</span>}</td>
                    <td>{money(gasto.base_imponible)}</td>
                    <td className="text-blue-300 font-bold">{money(gasto.iva_importe)}</td>
                    <td className="text-red-300 font-black">{money(gasto.total)}</td>
                    <td><span className={estadoBadge(gasto.estado)}>{gasto.estado}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => editarGasto(gasto)} className="btn btn-dark flex items-center gap-2">
                          <Edit3 size={15} /> Editar
                        </button>
                        <button onClick={() => borrar(gasto.id)} className="btn btn-dark text-red-300 flex items-center gap-2">
                          <Trash2 size={15} /> Eliminar
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

      <GastoModal
        open={open}
        editing={editing}
        form={form}
        saving={saving}
        setForm={setForm}
        onClose={() => {
          setOpen(false)
          setEditing(null)
          setForm(emptyForm)
        }}
        onSubmit={guardar}
      />
    </AppShell>
  )
}
