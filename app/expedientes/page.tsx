'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Lock,
  Ticket,
  Hourglass,
  Car,
  Plus,
  Search,
  SlidersHorizontal,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { ExpedienteService } from '@/lib/services/expedientes'
import { ArchivoService } from '@/lib/services/archivos'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'
import type { ExpedienteConRelaciones, ArchivoExpediente, ExpedienteHistorial } from '@/types/autokeys'
import { money } from '@/lib/status'

type Tab = 'resumen' | 'historial' | 'archivos' | 'notas'

function formatVehicle(item: ExpedienteConRelaciones) {
  const v = item.vehiculo
  if (!v) return 'Sin vehículo'
  return [v.marca, v.modelo].filter(Boolean).join(' ') || v.matricula || 'Vehículo sin datos'
}

function ExpedientesPageInner() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ExpedienteConRelaciones[]>([])
  const [query, setQuery] = useState(searchParams.get('tipo') || '')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('resumen')
  const [historial, setHistorial] = useState<ExpedienteHistorial[]>([])
  const [archivos, setArchivos] = useState<ArchivoExpediente[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ExpedienteConRelaciones | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId])

  async function load() {
    setLoading(true)
    try {
      const data = await ExpedienteService.getAll()
      setItems(data)
      if (data.length && !selectedId) setSelectedId(data[0].id)
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar los expedientes')
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true)
    try {
      const [full, files] = await Promise.all([
        ExpedienteService.getById(id),
        ArchivoService.list(id).catch(() => []),
      ])
      setHistorial(full?.historial || [])
      setArchivos(files)
    } finally {
      setDetailLoading(false)
    }
  }

  const openCount = items.filter((i) => !['terminado', 'entregado', 'cancelado'].includes(i.estado || '')).length
  const urgentCount = items.filter((i) => i.prioridad === 'urgente').length
  const enEsperaCount = items.filter((i) => ['pendiente_cliente', 'pendiente_material'].includes(i.estado || '')).length
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cerrados30 = items.filter((i) => ['terminado', 'entregado'].includes(i.estado || '') && new Date(i.updated_at || i.created_at || 0) >= thirtyDaysAgo).length

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter((e) => {
      const haystack = `${e.numero_ot || ''} ${e.tipo_trabajo || ''} ${e.estado || ''} ${e.cliente?.nombre || ''} ${e.vehiculo?.marca || ''} ${e.vehiculo?.modelo || ''} ${e.vehiculo?.matricula || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query])

  const selected = items.find((i) => i.id === selectedId) || null

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
      if (selectedId === item.id) setSelectedId(null)
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el expediente')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <LabShell
      title="Expedientes"
      actions={
        <Link href="/expedientes/nueva" className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
          <Plus size={16} /> Nuevo expediente
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Lock size={19} />} tone="red" label="Abiertos" value={openCount} trend={12} subtitle="vs semana anterior" />
          <LabStatCard icon={<Ticket size={19} />} tone="orange" label="Urgentes" value={urgentCount} trend={2} subtitle="vs semana anterior" />
          <LabStatCard icon={<Hourglass size={19} />} tone="blue" label="En espera" value={enEsperaCount} trend={-3} subtitle="vs semana anterior" />
          <LabStatCard icon={<Car size={19} />} tone="green" label="Cerrados (30 días)" value={cerrados30} trend={18} subtitle="vs 30 días anteriores" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[360px_1fr]">
          <LabPanel padded={false}>
            <div className="space-y-3 border-b border-white/[0.07] p-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar expedientes..." className="w-full border-0 bg-transparent p-0 text-sm" />
                <SlidersHorizontal size={15} className="shrink-0 text-zinc-600" />
              </div>
            </div>
            <div className="max-h-[70vh] space-y-1.5 overflow-y-auto p-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setTab('resumen') }}
                  className={`block w-full rounded-xl border px-3.5 py-3 text-left transition ${selectedId === item.id ? 'border-[#c81f2a]/40 bg-[#c81f2a]/[0.09]' : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{item.numero_ot || 'OT sin número'}</span>
                    <LabBadge tone={item.prioridad === 'urgente' ? 'red' : undefined} status={item.prioridad === 'urgente' ? 'urgente' : item.estado}>
                      {item.prioridad === 'urgente' ? 'Urgente' : (item.estado || 'Abierto')}
                    </LabBadge>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">{item.cliente?.nombre || 'Sin cliente'}</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-600">
                    <span className="truncate">{formatVehicle(item)} · {item.tipo_trabajo}</span>
                    <span className="shrink-0">{item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : ''}</span>
                  </div>
                </button>
              ))}
              {!loading && filtered.length === 0 && <div className="py-10 text-center text-xs text-zinc-600">Sin expedientes.</div>}
            </div>
          </LabPanel>

          <LabPanel padded={false}>
            {!selected ? (
              <div className="py-16 text-center text-sm text-zinc-600">Selecciona un expediente de la lista.</div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">Expediente {selected.numero_ot}</h2>
                    {selected.prioridad === 'urgente' && <LabBadge tone="red">Urgente</LabBadge>}
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/expedientes/${selected.id}`} className="flex items-center gap-1.5 text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">
                      Abrir ficha completa <ExternalLink size={13} />
                    </Link>
                    <button onClick={() => setPendingDelete(selected)} className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400">
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </div>

                <div className="flex gap-1 border-b border-white/[0.07] px-5 pt-3">
                  {(['resumen', 'historial', 'archivos', 'notas'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-t-lg px-4 py-2.5 text-xs font-bold capitalize transition ${tab === t ? 'border-b-2 border-[#ff3b46] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {tab === 'resumen' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-600">Información general</div>
                        <dl className="space-y-2.5 text-xs">
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Cliente</dt><dd className="font-semibold text-zinc-200">{selected.cliente?.nombre || '—'}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Teléfono</dt><dd className="font-semibold text-zinc-200">{selected.cliente?.telefono || '—'}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Email</dt><dd className="font-semibold text-zinc-200">{selected.cliente?.email || '—'}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Vehículo</dt><dd className="font-semibold text-zinc-200">{formatVehicle(selected)}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Matrícula</dt><dd className="font-semibold text-zinc-200">{selected.vehiculo?.matricula || '—'}</dd></div>
                          <div className="flex justify-between pb-2"><dt className="text-zinc-600">VIN</dt><dd className="font-mono text-[11px] font-semibold text-zinc-200">{selected.vehiculo?.bastidor || '—'}</dd></div>
                        </dl>
                      </div>
                      <div>
                        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-600">Detalles del servicio</div>
                        <dl className="space-y-2.5 text-xs">
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Tipo de trabajo</dt><dd className="font-semibold text-zinc-200">{selected.tipo_trabajo || '—'}</dd></div>
                          <div className="border-b border-white/[0.06] pb-2"><dt className="mb-1 text-zinc-600">Descripción</dt><dd className="text-zinc-300">{selected.descripcion || '—'}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Prioridad</dt><dd><LabBadge tone={selected.prioridad === 'urgente' ? 'red' : 'zinc'}>{selected.prioridad || 'normal'}</LabBadge></dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Técnico asignado</dt><dd className="font-semibold text-zinc-200">{selected.tecnico || 'Sin asignar'}</dd></div>
                          <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Estado</dt><dd><LabBadge status={selected.estado}>{selected.estado || 'recibido'}</LabBadge></dd></div>
                          <div className="flex justify-between pb-2"><dt className="text-zinc-600">Importe</dt><dd className="font-bold text-zinc-100">{money(selected.precio_final || selected.precio_estimado)}</dd></div>
                        </dl>
                      </div>
                    </div>
                  )}

                  {tab === 'historial' && (
                    <div className="space-y-3">
                      {historial.map((h) => (
                        <div key={h.id} className="flex gap-3 border-l-2 border-[#c81f2a]/40 pl-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{h.evento}</span>
                              <span className="text-[10px] text-zinc-600">{h.created_at ? new Date(h.created_at).toLocaleString('es-ES') : ''}</span>
                            </div>
                            {h.descripcion && <p className="mt-0.5 text-xs text-zinc-500">{h.descripcion}</p>}
                            <p className="mt-0.5 text-[10px] text-zinc-600">{h.usuario || 'Sistema'}</p>
                          </div>
                        </div>
                      ))}
                      {!detailLoading && historial.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin eventos registrados.</div>}
                    </div>
                  )}

                  {tab === 'archivos' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {archivos.map((a) => (
                        <a key={a.id} href={a.url || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs hover:bg-white/[0.04]">
                          {String(a.tipo || '').startsWith('foto') ? <Paperclip size={15} className="shrink-0 text-[#6ea6ff]" /> : <FileText size={15} className="shrink-0 text-[#ff5468]" />}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-zinc-200">{a.nombre_archivo}</div>
                            <div className="text-[10px] text-zinc-600">{a.created_at ? new Date(a.created_at).toLocaleDateString('es-ES') : ''}</div>
                          </div>
                        </a>
                      ))}
                      {!detailLoading && archivos.length === 0 && <div className="col-span-full py-6 text-center text-xs text-zinc-600">Sin archivos adjuntos.</div>}
                    </div>
                  )}

                  {tab === 'notas' && (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas del cliente</div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">{selected.notas_cliente || 'Sin notas del cliente.'}</div>
                      </div>
                      <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas internas</div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">{selected.notas_internas || 'Sin notas internas.'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar ${pendingDelete?.numero_ot || 'este expediente'}`}
        description="Esto puede borrar datos técnicos asociados (ECU, llaves, historial, archivos, material y facturación relacionada). Para trabajos reales es mejor cambiar el estado a cancelado en vez de eliminar."
        confirmLabel="Sí, eliminar definitivamente"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </LabShell>
  )
}

export default function ExpedientesPage() {
  return (
    <Suspense fallback={null}>
      <ExpedientesPageInner />
    </Suspense>
  )
}
