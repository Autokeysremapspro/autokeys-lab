'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Car,
  Lock,
  Stethoscope,
  CheckCircle2,
  Plus,
  Search,
  SlidersHorizontal,
  MoreVertical,
  User,
  Phone,
  Cpu,
  ClipboardList,
  FileSearch,
  FileBarChart,
  CheckCircle,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { supabase } from '@/lib/supabase'
import VehiculoModal from '@/components/VehiculoModal'

type Cliente = { id: string; nombre: string; telefono: string | null }
type Vehiculo = {
  id: string
  cliente_id: string | null
  marca: string | null
  modelo: string | null
  motor: string | null
  anio: number | null
  matricula: string | null
  bastidor: string | null
  ecu: string | null
  hardware: string | null
  software: string | null
  notas: string | null
  created_at: string
  clientes?: Cliente | null
}
type ExpedienteLite = { id: string; numero_ot: string | null; vehiculo_id: string | null; estado: string | null; tipo_trabajo: string | null; tecnico: string | null; created_at: string }

function estadoVehiculo(exp?: ExpedienteLite | null) {
  if (!exp) return { tone: 'zinc' as const, label: 'Sin trabajo' }
  const estado = String(exp.estado || '')
  if (['entregado', 'terminado'].includes(estado)) return { tone: 'green' as const, label: 'Finalizado' }
  if (String(exp.tipo_trabajo || '').toLowerCase().includes('diagn')) return { tone: 'blue' as const, label: 'Diagnóstico' }
  if (estado === 'pendiente_cliente') return { tone: 'amber' as const, label: 'Pendiente' }
  return { tone: 'red' as const, label: 'En taller' }
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [expedientesPorVehiculo, setExpedientesPorVehiculo] = useState<Map<string, ExpedienteLite>>(new Map())
  const [historial, setHistorial] = useState<ExpedienteLite[]>([])
  const [query, setQuery] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedId) loadHistorial(selectedId) }, [selectedId])

  async function loadData() {
    setLoading(true)
    const [vehiculosRes, clientesRes, expedientesRes] = await Promise.all([
      supabase.from('vehiculos').select('*, clientes:cliente_id(id,nombre,telefono)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,nombre,telefono').order('nombre', { ascending: true }),
      supabase.from('expedientes').select('id,numero_ot,vehiculo_id,estado,tipo_trabajo,tecnico,created_at').order('created_at', { ascending: false }),
    ])
    if (vehiculosRes.error) toast.error(vehiculosRes.error.message)

    const rows = (vehiculosRes.data || []) as Vehiculo[]
    setVehiculos(rows)
    setClientes((clientesRes.data || []) as Cliente[])

    const latest = new Map<string, ExpedienteLite>()
    for (const e of (expedientesRes.data || []) as ExpedienteLite[]) {
      if (e.vehiculo_id && !latest.has(e.vehiculo_id)) latest.set(e.vehiculo_id, e)
    }
    setExpedientesPorVehiculo(latest)

    if (rows.length && !selectedId) setSelectedId(rows[0].id)
    setLoading(false)
  }

  async function loadHistorial(vehiculoId: string) {
    const { data } = await supabase
      .from('expedientes')
      .select('id,numero_ot,vehiculo_id,estado,tipo_trabajo,tecnico,created_at')
      .eq('vehiculo_id', vehiculoId)
      .order('created_at', { ascending: false })
      .limit(6)
    setHistorial((data || []) as ExpedienteLite[])
  }

  const marcas = useMemo(() => Array.from(new Set(vehiculos.map((v) => v.marca).filter(Boolean))) as string[], [vehiculos])

  const filtered = useMemo(() => {
    let out = vehiculos
    if (marcaFiltro !== 'todas') out = out.filter((v) => v.marca === marcaFiltro)
    const q = query.trim().toLowerCase()
    if (!q) return out
    return out.filter((v) => [v.marca, v.modelo, v.matricula, v.bastidor, v.clientes?.nombre].some((val) => (val || '').toLowerCase().includes(q)))
  }, [vehiculos, query, marcaFiltro])

  const selected = vehiculos.find((v) => v.id === selectedId) || null
  const selectedExp = selected ? expedientesPorVehiculo.get(selected.id) : null

  const enTaller = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'En taller').length
  const pendientesEntrega = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Pendiente').length
  const diagnosticos = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Diagnóstico').length
  const finalizados = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Finalizado').length

  async function saveVehiculo(payload: any) {
    setSaving(true)
    const cleanPayload = {
      cliente_id: payload.cliente_id || null,
      marca: payload.marca?.trim() || null,
      modelo: payload.modelo?.trim() || null,
      motor: payload.motor || null,
      anio: payload.anio ? Number(payload.anio) : null,
      matricula: payload.matricula || null,
      bastidor: payload.bastidor || null,
      ecu: payload.ecu || null,
      hardware: payload.hardware || null,
      software: payload.software || null,
      notas: payload.notas || null,
    }
    const { error, data } = editing
      ? await supabase.from('vehiculos').update(cleanPayload).eq('id', editing.id).select('id').single()
      : await supabase.from('vehiculos').insert(cleanPayload).select('id').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Vehículo actualizado' : 'Vehículo creado')
    setModalOpen(false)
    setEditing(null)
    await loadData()
    if (data?.id) setSelectedId(data.id)
  }

  const badge = estadoVehiculo(selectedExp)

  return (
    <LabShell
      title="Vehículos"
      subtitle="Gestión y seguimiento de vehículos"
      actions={
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
          <Plus size={16} /> Nuevo vehículo
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Car size={19} />} tone="red" label="Vehículos en taller" value={enTaller} trend={8} subtitle="vs. semana anterior" />
          <LabStatCard icon={<Lock size={19} />} tone="orange" label="Pendientes de entrega" value={pendientesEntrega} trend={7} subtitle="vs. semana anterior" />
          <LabStatCard icon={<Stethoscope size={19} />} tone="blue" label="Diagnósticos abiertos" value={diagnosticos} trend={12} subtitle="vs. semana anterior" />
          <LabStatCard icon={<CheckCircle2 size={19} />} tone="green" label="Vehículos finalizados" value={finalizados} trend={18} subtitle="vs. semana anterior" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_400px]">
          <LabPanel padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] p-4">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por matrícula o VIN..." className="w-full border-0 bg-transparent p-0 text-sm" />
              </div>
              <select value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                <option value="todas">Marca: Todas</option>
                {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]">
                <SlidersHorizontal size={15} /> Más filtros
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Matrícula</th>
                    <th className="px-3 py-3 font-bold">VIN</th>
                    <th className="px-3 py-3 font-bold">Marca / Modelo</th>
                    <th className="px-3 py-3 font-bold">Año</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-3 py-3 font-bold">Trabajo actual</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const exp = expedientesPorVehiculo.get(v.id)
                    const b = estadoVehiculo(exp)
                    return (
                      <tr key={v.id} onClick={() => setSelectedId(v.id)} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === v.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}>
                        <td className="px-5 py-3 font-bold text-white">{v.matricula || '—'}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-zinc-500">{v.bastidor || '—'}</td>
                        <td className="px-3 py-3 text-zinc-300">{[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{v.anio || '—'}</td>
                        <td className="px-3 py-3"><LabBadge tone={b.tone}>{b.label}</LabBadge></td>
                        <td className="px-3 py-3 text-zinc-400">{exp?.tipo_trabajo || '—'}</td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-zinc-600">Ningún vehículo coincide con esos filtros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 text-xs text-zinc-500">Mostrando 1 a {filtered.length} de {vehiculos.length} vehículos</div>
          </LabPanel>

          <LabPanel
            title={selected ? <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Matrícula <span className="ml-1 text-base normal-case tracking-normal text-white">{selected.matricula || '—'}</span></span> : 'Detalle del vehículo'}
            action={selected && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditing(selected); setModalOpen(true) }} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/5">Editar</button>
                <button className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><MoreVertical size={16} /></button>
              </div>
            )}
          >
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona un vehículo de la lista.</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{[selected.marca, selected.modelo].filter(Boolean).join(' ') || 'Vehículo'}</div>
                    <LabBadge tone={badge.tone}>{badge.label}</LabBadge>
                  </div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.03] text-zinc-700"><Car size={32} strokeWidth={1.2} /></div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div><div className="text-zinc-600">VIN</div><div className="mt-0.5 truncate font-mono font-bold text-zinc-200">{selected.bastidor || '—'}</div></div>
                  <div><div className="text-zinc-600">Año</div><div className="mt-0.5 font-bold text-zinc-200">{selected.anio || '—'}</div></div>
                  <div className="flex items-center gap-1.5"><User size={12} className="text-zinc-600" /><div><div className="text-zinc-600">Cliente</div><div className="font-bold text-zinc-200">{selected.clientes?.nombre || '—'}</div></div></div>
                  <div className="flex items-center gap-1.5"><Phone size={12} className="text-zinc-600" /><div><div className="text-zinc-600">Teléfono</div><div className="font-bold text-zinc-200">{selected.clientes?.telefono || '—'}</div></div></div>
                  <div><div className="text-zinc-600">Motor</div><div className="mt-0.5 font-bold text-zinc-200">{selected.motor || '—'}</div></div>
                  <div><div className="text-zinc-600">Trabajo actual</div><div className="mt-0.5 font-bold text-zinc-200">{selectedExp?.tipo_trabajo || '—'}</div></div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600"><Cpu size={13} /> Módulos vinculados</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.ecu && <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-zinc-300">ECU · {selected.ecu}</span>}
                    {selected.hardware && <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-zinc-300">HW · {selected.hardware}</span>}
                    {selected.software && <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-zinc-300">SW · {selected.software}</span>}
                    {!selected.ecu && !selected.hardware && !selected.software && <span className="text-xs text-zinc-600">Sin módulos registrados.</span>}
                  </div>
                </div>

                {selected.notas && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas técnicas</div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">{selected.notas}</div>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">Historial de servicios</div>
                  <div className="space-y-1.5">
                    {historial.map((h) => (
                      <Link key={h.id} href={`/expedientes/${h.id}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs hover:bg-white/[0.04]">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-200">{h.tipo_trabajo}</div>
                          <div className="text-[10px] text-zinc-600">{new Date(h.created_at).toLocaleDateString('es-ES')} · {h.tecnico || 'Sin asignar'}</div>
                        </div>
                        <LabBadge status={h.estado}>{h.estado || 'recibido'}</LabBadge>
                      </Link>
                    ))}
                    {historial.length === 0 && <div className="text-xs text-zinc-600">Sin historial todavía.</div>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
                  <Link href={`/expedientes/nueva?vehiculo=${selected.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><ClipboardList size={14} /> Nueva orden</Link>
                  <button onClick={() => toast('Diagnóstico programado')} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><FileSearch size={14} /> Diagnóstico</button>
                  <button onClick={() => toast('Lectura DTC en cola')} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><FileBarChart size={14} /> Lectura DTC</button>
                  <button onClick={() => toast('Informe generado')} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><FileBarChart size={14} /> Informe</button>
                </div>
                <button onClick={() => toast.success('Trabajo marcado como finalizado')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c81f2a] py-2.5 text-xs font-bold text-white hover:bg-[#e2242f]"><CheckCircle size={14} /> Finalizar trabajo</button>
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <VehiculoModal
        open={modalOpen}
        clientes={clientes}
        initialData={editing || undefined}
        loading={saving}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={saveVehiculo}
      />
    </LabShell>
  )
}
