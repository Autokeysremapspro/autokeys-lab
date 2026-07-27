'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import ExpedienteStatusBadge from '@/components/ExpedienteStatusBadge'
import ConfirmModal from '@/components/ConfirmModal'
import CustomSelect from '@/components/ak/CustomSelect'
import { ExpedienteService } from '@/lib/services/expedientes'
import { supabase } from '@/lib/supabase'
import type { ExpedienteConRelaciones } from '@/types/autokeys'
import { Car, ClipboardList, Cpu, Eye, KeyRound, Plus, Search, Trash2, UserRound, ArrowUpDown } from 'lucide-react'

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'pendiente_cliente', label: 'Pendiente cliente' },
  { value: 'pendiente_material', label: 'Pendiente material' },
  { value: 'terminado', label: 'Terminado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const SORT_OPTIONS = [
  { value: 'reciente', label: 'Más recientes' },
  { value: 'urgente', label: 'Urgentes primero' },
  { value: 'importe', label: 'Importe (mayor a menor)' },
]

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function formatVehicle(item: ExpedienteConRelaciones) {
  const v = item.vehiculo
  if (!v) return 'Sin vehículo'
  return [v.marca, v.modelo, v.matricula].filter(Boolean).join(' · ') || 'Vehículo sin datos'
}

function techIcon(tipo?: string | null) {
  const text = (tipo || '').toLowerCase()
  if (text.includes('llave') || text.includes('cas') || text.includes('fem') || text.includes('bdc')) return KeyRound
  return Cpu
}

type QuickFilter = 'todos' | 'abiertas' | 'urgentes' | 'ecu' | 'llaves'

function ExpedientesPageInner() {
  const [items, setItems] = useState<ExpedienteConRelaciones[]>([])
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('tipo') || '')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sort, setSort] = useState('reciente')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ExpedienteConRelaciones | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await ExpedienteService.getAll())
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los expedientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCount = items.filter(i => !['terminado', 'entregado', 'cancelado'].includes(i.estado || '')).length
  const urgentCount = items.filter(i => i.prioridad === 'urgente').length
  const ecuCount = items.filter(i => i.ecu).length
  const keyCount = items.filter(i => i.llaves).length

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    let out = items

    if (quickFilter === 'abiertas') out = out.filter(i => !['terminado', 'entregado', 'cancelado'].includes(i.estado || ''))
    if (quickFilter === 'urgentes') out = out.filter(i => i.prioridad === 'urgente')
    if (quickFilter === 'ecu') out = out.filter(i => i.ecu)
    if (quickFilter === 'llaves') out = out.filter(i => i.llaves)

    if (estadoFilter !== 'todos') out = out.filter(i => (i.estado || 'recibido') === estadoFilter)

    if (q) {
      out = out.filter((e) => {
        const haystack = `${e.numero_ot || ''} ${e.tipo_trabajo || ''} ${e.estado || ''} ${e.prioridad || ''} ${e.tecnico || ''} ${e.cliente?.nombre || ''} ${e.cliente?.telefono || ''} ${e.vehiculo?.marca || ''} ${e.vehiculo?.modelo || ''} ${e.vehiculo?.matricula || ''} ${e.vehiculo?.bastidor || ''} ${e.ecu?.modelo_ecu || ''} ${e.ecu?.hw || ''} ${e.ecu?.sw || ''}`.toLowerCase()
        return haystack.includes(q)
      })
    }

    const sorted = [...out]
    if (sort === 'urgente') {
      sorted.sort((a, b) => (b.prioridad === 'urgente' ? 1 : 0) - (a.prioridad === 'urgente' ? 1 : 0))
    } else if (sort === 'importe') {
      sorted.sort((a, b) => Number(b.precio_final || b.precio_estimado || 0) - Number(a.precio_final || a.precio_estimado || 0))
    }
    return sorted
  }, [items, query, quickFilter, estadoFilter, sort])

  function askDelete(item: ExpedienteConRelaciones) {
    setPendingDelete(item)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const item = pendingDelete
    setDeleting(true)

    try {
      await Promise.allSettled([
        supabase.from('expediente_ecu').delete().eq('expediente_id', item.id),
        supabase.from('expediente_llaves').delete().eq('expediente_id', item.id),
        supabase.from('expediente_historial').delete().eq('expediente_id', item.id),
        supabase.from('archivos_expediente').delete().eq('expediente_id', item.id),
        supabase.from('servicios_expediente').delete().eq('expediente_id', item.id),
        supabase.from('movimientos_stock').update({ expediente_id: null }).eq('expediente_id', item.id),
        supabase.from('facturas').update({ expediente_id: null }).eq('expediente_id', item.id),
      ])

      const { error } = await supabase.from('expedientes').delete().eq('id', item.id)
      if (error) throw error

      toast.success('Expediente eliminado')
      setPendingDelete(null)
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el expediente')
    } finally {
      setDeleting(false)
    }
  }

  const filtros: { key: QuickFilter; label: string; value: number }[] = [
    { key: 'todos', label: 'Todos', value: items.length },
    { key: 'abiertas', label: 'OT abiertas', value: openCount },
    { key: 'urgentes', label: 'Urgentes', value: urgentCount },
    { key: 'ecu', label: 'Fichas ECU', value: ecuCount },
    { key: 'llaves', label: 'Fichas llaves', value: keyCount },
  ]

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-7">
        <div>
          <p className="ak-mono text-sm text-[#ffb870] font-bold uppercase tracking-[0.2em]">Autokeys Core</p>
          <h2 className="text-3xl font-bold mt-1">Expedientes inteligentes</h2>
          <p className="text-zinc-500 mt-2">OT, ficha técnica, ECU, llaves e historial del laboratorio.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/alta-rapida" className="btn btn-dark inline-flex items-center gap-2 justify-center">
            <Plus size={18} /> Alta móvil
          </Link>
          <Link href="/expedientes/nueva" className="btn btn-red inline-flex items-center gap-2 justify-center">
            <Plus size={18} /> Nueva OT
          </Link>
        </div>
      </div>

      {/* Filtros rápidos — antes eran solo números decorativos, ahora cada uno filtra la lista al pulsarlo */}
      <div className="grid md:grid-cols-5 gap-3 mb-6">
        {filtros.map((f) => {
          const active = quickFilter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setQuickFilter(f.key)}
              className={`card p-5 text-left transition ${active ? 'border-[#e2954d]/60 bg-[#e2954d]/[.08]' : 'hover:border-[#e2954d]/25'}`}
            >
              <p className={`text-sm font-bold ${active ? 'text-[#ffb870]' : 'text-zinc-400'}`}>{f.label}</p>
              <p className="text-3xl font-bold mt-2">{f.value}</p>
            </button>
          )
        })}
      </div>

      <div className="card p-5 mb-6 space-y-3">
        <div className="flex items-center gap-3 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3">
          <Search size={18} className="text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por OT, cliente, matrícula, VIN, ECU, HW, SW..." className="bg-transparent border-0 p-0 w-full" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CustomSelect className="flex-1" value={estadoFilter} onChange={setEstadoFilter} options={ESTADO_OPTIONS} />
          <CustomSelect className="flex-1" value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>
        {(quickFilter !== 'todos' || estadoFilter !== 'todos' || query) && (
          <p className="ak-mono text-xs text-zinc-500 flex items-center gap-1.5">
            <ArrowUpDown size={12} /> Mostrando {filtered.length} de {items.length} expedientes
          </p>
        )}
      </div>

      {error && <div className="card p-4 border-red-500/30 text-red-300 mb-5">{error}</div>}

      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const Icon = techIcon(item.tipo_trabajo)
            return (
              <div key={item.id} className="card p-5 hover:border-[#e2954d]/30 transition">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#e2954d]/15 border border-[#e2954d]/20 flex items-center justify-center text-[#ffb870]"><Icon size={24} /></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold">{item.numero_ot || 'OT sin número'}</h3>
                        <ExpedienteStatusBadge status={item.estado} />
                        {item.prioridad === 'urgente' && <span className="rounded-full border border-red-500/40 bg-red-500/15 text-red-300 px-3 py-1 text-xs font-bold uppercase">Urgente</span>}
                      </div>
                      <p className="text-zinc-300 font-bold mt-1">{item.tipo_trabajo}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 mt-3">
                        <span className="inline-flex items-center gap-2"><UserRound size={16} /> {item.cliente?.nombre || 'Sin cliente'}</span>
                        <span className="inline-flex items-center gap-2"><Car size={16} /> {formatVehicle(item)}</span>
                        <span className="inline-flex items-center gap-2"><ClipboardList size={16} /> {item.tecnico || 'Sin técnico'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-zinc-500 font-bold uppercase">Importe</p>
                      <p className="text-lg font-bold">{money(item.precio_final || item.precio_estimado)}</p>
                    </div>
                    <Link href={`/expedientes/${item.id}`} className="btn btn-dark inline-flex items-center gap-2"><Eye size={17} /> Abrir ficha</Link>
                    <button onClick={() => askDelete(item)} className="btn btn-dark inline-flex items-center gap-2 text-red-300"><Trash2 size={17} /> Eliminar</button>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length && (
            <div className="card p-10 text-center text-zinc-500">
              {items.length === 0 ? 'Todavía no hay expedientes — crea el primero con "Nueva OT".' : 'Ningún expediente coincide con estos filtros. Prueba a quitar alguno.'}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar ${pendingDelete?.numero_ot || 'este expediente'}`}
        description="Esto puede borrar datos técnicos asociados (ECU, llaves, checklist, tiempos, archivos, material y facturación relacionada). Para trabajos reales es mejor cambiar el estado a cancelado en vez de eliminar."
        confirmLabel="Sí, eliminar definitivamente"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  )
}

export default function ExpedientesPage() {
  return (
    <Suspense fallback={null}>
      <ExpedientesPageInner />
    </Suspense>
  )
}
