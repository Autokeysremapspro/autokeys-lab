'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ClipboardList,
  CheckCircle2,
  Plus,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { ExpedienteService } from '@/lib/services/expedientes'
import { ChecklistService } from '@/lib/services/checklist'
import type { ExpedienteConRelaciones, ChecklistItem } from '@/types/autokeys'

type ColumnKey = 'pendiente' | 'en_proceso' | 'material' | 'listo' | 'finalizado'

const COLUMNS: { key: ColumnKey; label: string; dot: string; estados: string[]; progressBase: number }[] = [
  { key: 'pendiente', label: 'Pendiente', dot: 'bg-[#ff5468]', estados: ['recibido'], progressBase: 5 },
  { key: 'en_proceso', label: 'En proceso', dot: 'bg-[#ffab52]', estados: ['en_proceso', 'diagnostico'], progressBase: 50 },
  { key: 'material', label: 'Esperando material', dot: 'bg-[#6ea6ff]', estados: ['pendiente_material', 'pendiente_cliente'], progressBase: 25 },
  { key: 'listo', label: 'Listo para entrega', dot: 'bg-[#4ade95]', estados: ['terminado'], progressBase: 95 },
  { key: 'finalizado', label: 'Finalizado', dot: 'bg-[#b39bff]', estados: ['entregado'], progressBase: 100 },
]

function columnFor(estado?: string | null): ColumnKey {
  const found = COLUMNS.find((c) => c.estados.includes(String(estado || 'recibido')))
  return found?.key || 'pendiente'
}

function hashJitter(id: string, spread: number) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return h % spread
}

function prioridadBadge(prioridad?: string | null) {
  const p = String(prioridad || 'media').toLowerCase()
  if (p === 'urgente' || p === 'alta') return { label: 'Alta', tone: 'red' as const }
  if (p === 'baja') return { label: 'Baja', tone: 'green' as const }
  return { label: 'Media', tone: 'amber' as const }
}

export default function OrdenesTrabajoPage() {
  const [items, setItems] = useState<ExpedienteConRelaciones[]>([])
  const [loading, setLoading] = useState(true)
  const [checklistExp, setChecklistExp] = useState<ExpedienteConRelaciones | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await ExpedienteService.getAll()
      setItems(data)
      const focus = data.find((i) => !['entregado', 'cancelado'].includes(String(i.estado)))
      if (focus) {
        setChecklistExp(focus)
        ChecklistService.getByExpediente(focus.id).then(setChecklist).catch(() => setChecklist([]))
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }

  const activos = items.filter((i) => i.estado !== 'cancelado')
  const byColumn = useMemo(() => {
    const map = new Map<ColumnKey, ExpedienteConRelaciones[]>(COLUMNS.map((c) => [c.key, []]))
    for (const item of activos) map.get(columnFor(item.estado))!.push(item)
    return map
  }, [activos])

  const cargaTecnicos = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of activos) {
      if (!['entregado'].includes(String(i.estado))) {
        const tec = i.tecnico || 'Sin asignar'
        map.set(tec, (map.get(tec) || 0) + 1)
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [activos])

  const vencidas = useMemo(() => {
    const now = new Date()
    return items
      .filter((i) => i.fecha_entrega && new Date(i.fecha_entrega) < now && !['entregado', 'cancelado'].includes(String(i.estado)))
      .sort((a, b) => new Date(a.fecha_entrega || 0).getTime() - new Date(b.fecha_entrega || 0).getTime())
      .slice(0, 5)
  }, [items])

  async function toggleChecklist(item: ChecklistItem) {
    try {
      await ChecklistService.toggle(item.id, !item.completado)
      setChecklist((prev) => prev.map((c) => (c.id === item.id ? { ...c, completado: !c.completado } : c)))
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar el checklist')
    }
  }

  const totalOrdenes = activos.length

  return (
    <LabShell
      title="Órdenes de trabajo"
      subtitle="Gestiona y da seguimiento a todas las órdenes del taller"
      actions={
        <>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]">
            <SlidersHorizontal size={15} /> Filtros
          </button>
          <Link href="/expedientes/nueva" className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
            <Plus size={16} /> Nueva orden de trabajo
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-[#ff5468]"><ClipboardList size={16} /><span className="text-[11px] font-bold text-zinc-500">Total órdenes</span></div>
            <div className="mt-1.5 text-xl font-bold text-white">{totalOrdenes}</div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${c.dot}`} /><span className="text-[11px] font-bold text-zinc-500">{c.label}</span></div>
              <div className="mt-1.5 text-xl font-bold text-white">{byColumn.get(c.key)?.length ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto">
            <div className="grid min-w-[1100px] grid-cols-5 gap-3">
              {COLUMNS.map((col) => {
                const list = byColumn.get(col.key) || []
                const visible = list.slice(0, 3)
                const rest = list.length - visible.length
                return (
                  <div key={col.key} className="rounded-2xl border border-white/10 bg-white/[0.015] p-3">
                    <div className="mb-3 flex items-center gap-2 px-1">
                      <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                      <span className="text-xs font-bold text-zinc-300">{col.label}</span>
                      <span className="ml-auto text-xs font-bold text-zinc-600">{list.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {visible.map((item) => {
                        const jitter = hashJitter(item.id, 12)
                        const progress = Math.min(100, col.progressBase + jitter)
                        const pr = prioridadBadge(item.prioridad)
                        return (
                          <Link
                            key={item.id}
                            href={`/expedientes/${item.id}`}
                            className="block rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-xs hover:bg-white/[0.045]"
                          >
                            <div className="font-bold text-white">{item.numero_ot}</div>
                            <div className="mt-1.5 space-y-0.5 text-zinc-400">
                              <div><span className="text-zinc-600">Cliente:</span> {item.cliente?.nombre || '—'}</div>
                              <div><span className="text-zinc-600">Vehículo:</span> {[item.vehiculo?.marca, item.vehiculo?.modelo].filter(Boolean).join(' ') || '—'}</div>
                              <div><span className="text-zinc-600">Servicio:</span> {item.tipo_trabajo}</div>
                              <div><span className="text-zinc-600">Técnico:</span> {item.tecnico || '—'}</div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <LabBadge tone={pr.tone}>{pr.label}</LabBadge>
                              <span className="font-bold text-zinc-400">{progress}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div className={`h-full rounded-full ${col.dot}`} style={{ width: `${progress}%` }} />
                            </div>
                          </Link>
                        )
                      })}
                      {list.length === 0 && <div className="py-6 text-center text-[11px] text-zinc-600">Sin órdenes.</div>}
                      {rest > 0 && (
                        <button className="w-full rounded-xl border border-dashed border-white/10 py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-300">
                          + {rest} órdenes más
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <LabPanel title="Carga de trabajo por técnico">
              <div className="space-y-2.5">
                {cargaTecnicos.map(([tecnico, count]) => (
                  <div key={tecnico} className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c81f2a]/15 text-[10px] font-bold text-[#ff5468]">
                      {tecnico.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="flex-1 truncate text-xs font-semibold text-zinc-300">{tecnico}</span>
                    <span className="text-xs font-bold text-zinc-500">{count} / 10</span>
                  </div>
                ))}
                {cargaTecnicos.length === 0 && <div className="text-xs text-zinc-600">Sin técnicos asignados.</div>}
              </div>
            </LabPanel>

            <LabPanel title="Tareas vencidas" action={<LabBadge tone="red">{vencidas.length}</LabBadge>}>
              <div className="space-y-2">
                {vencidas.map((item) => (
                  <Link key={item.id} href={`/expedientes/${item.id}`} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs hover:bg-white/[0.04]">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#ff5468]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-white">{item.numero_ot} · {item.cliente?.nombre || '—'}</div>
                      <div className="text-[10px] text-zinc-600">Vencida: {item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleDateString('es-ES') : '—'}</div>
                    </div>
                    <LabBadge tone={prioridadBadge(item.prioridad).tone}>{prioridadBadge(item.prioridad).label}</LabBadge>
                  </Link>
                ))}
                {vencidas.length === 0 && <div className="py-4 text-center text-xs text-zinc-600">Sin tareas vencidas.</div>}
              </div>
              {vencidas.length > 0 && <Link href="/expedientes" className="mt-3 block text-center text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver todas las vencidas</Link>}
            </LabPanel>

            <LabPanel title="Checklist rápido" action={checklistExp && <span className="text-[10px] text-zinc-600">{checklistExp.numero_ot}</span>}>
              <div className="space-y-2">
                {checklist.map((c) => (
                  <button key={c.id} onClick={() => toggleChecklist(c)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white/[0.03]">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${c.completado ? 'border-[#4ade95] bg-[#4ade95]/20 text-[#4ade95]' : 'border-white/20 text-transparent'}`}>
                      <CheckCircle2 size={11} />
                    </span>
                    <span className={c.completado ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{c.titulo}</span>
                  </button>
                ))}
                {checklist.length === 0 && <div className="py-4 text-center text-xs text-zinc-600">{checklistExp ? 'Sin checklist en esta orden.' : 'Sin órdenes abiertas.'}</div>}
              </div>
              {checklistExp && <Link href={`/expedientes/${checklistExp.id}`} className="mt-3 block text-center text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver todo</Link>}
            </LabPanel>
          </div>
        </div>
      </div>
    </LabShell>
  )
}
