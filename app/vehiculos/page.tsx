'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Car, Lock, Stethoscope, CheckCircle2, Plus, Search, SlidersHorizontal, MoreVertical, ClipboardList, FileSearch, FileBarChart, CheckCircle } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { supabase } from '@/lib/supabase'
import VehiculoModal from '@/components/VehiculoModal'

type Cliente = { id: string; nombre: string; telefono: string | null }
type Vehiculo = {
  id: string; cliente_id: string | null; marca: string | null; modelo: string | null; motor: string | null; anio: number | null;
  matricula: string | null; bastidor: string | null; ecu: string | null; hardware: string | null; software: string | null;
  notas: string | null; created_at: string; clientes?: Cliente | null
}
type ExpedienteLite = { id: string; numero_ot: string | null; vehiculo_id: string | null; estado: string | null; tipo_trabajo: string | null; tecnico: string | null; created_at: string }

function estadoVehiculo(exp?: ExpedienteLite | null) {
  if (!exp) return { tone: 'zinc' as const, label: 'En espera' }
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
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
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
    setVehiculos(rows); setClientes((clientesRes.data || []) as Cliente[])
    const latest = new Map<string, ExpedienteLite>()
    for (const e of (expedientesRes.data || []) as ExpedienteLite[]) if (e.vehiculo_id && !latest.has(e.vehiculo_id)) latest.set(e.vehiculo_id, e)
    setExpedientesPorVehiculo(latest)
    if (rows.length && !selectedId) setSelectedId(rows[0].id)
    setLoading(false)
  }

  async function loadHistorial(vehiculoId: string) {
    const { data } = await supabase.from('expedientes').select('id,numero_ot,vehiculo_id,estado,tipo_trabajo,tecnico,created_at').eq('vehiculo_id', vehiculoId).order('created_at', { ascending: false }).limit(6)
    setHistorial((data || []) as ExpedienteLite[])
  }

  const marcas = useMemo(() => Array.from(new Set(vehiculos.map((v) => v.marca).filter(Boolean))) as string[], [vehiculos])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vehiculos.filter((v) => {
      const exp = expedientesPorVehiculo.get(v.id)
      const label = estadoVehiculo(exp).label.toLowerCase()
      const matchesQ = !q || [v.marca, v.modelo, v.matricula, v.bastidor, v.clientes?.nombre].some((val) => (val || '').toLowerCase().includes(q))
      const matchesMarca = marcaFiltro === 'todas' || v.marca === marcaFiltro
      const matchesEstado = estadoFiltro === 'todos' || label === estadoFiltro
      return matchesQ && matchesMarca && matchesEstado
    })
  }, [vehiculos, query, marcaFiltro, estadoFiltro, expedientesPorVehiculo])

  const selected = vehiculos.find((v) => v.id === selectedId) || null
  const selectedExp = selected ? expedientesPorVehiculo.get(selected.id) : null
  const badge = estadoVehiculo(selectedExp)
  const enTaller = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'En taller').length
  const pendientesEntrega = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Pendiente').length
  const diagnosticos = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Diagnóstico').length
  const finalizados = Array.from(expedientesPorVehiculo.values()).filter((e) => estadoVehiculo(e).label === 'Finalizado').length

  async function saveVehiculo(payload: any) {
    setSaving(true)
    const cleanPayload = { cliente_id: payload.cliente_id || null, marca: payload.marca?.trim() || null, modelo: payload.modelo?.trim() || null, motor: payload.motor || null, anio: payload.anio ? Number(payload.anio) : null, matricula: payload.matricula || null, bastidor: payload.bastidor || null, ecu: payload.ecu || null, hardware: payload.hardware || null, software: payload.software || null, notas: payload.notas || null }
    const { error, data } = editing ? await supabase.from('vehiculos').update(cleanPayload).eq('id', editing.id).select('id').single() : await supabase.from('vehiculos').insert(cleanPayload).select('id').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Vehículo actualizado' : 'Vehículo creado')
    setModalOpen(false); setEditing(null); await loadData(); if (data?.id) setSelectedId(data.id)
  }

  return (
    <LabShell title="Vehículos" subtitle="Gestión y seguimiento de vehículos">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_405px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <LabStatCard icon={<Car size={18}/>} tone="red" label="Vehículos en taller" value={enTaller} trend={8} subtitle="vs. semana anterior" />
            <LabStatCard icon={<Lock size={18}/>} tone="orange" label="Pendientes de entrega" value={pendientesEntrega} trend={7} subtitle="vs. semana anterior" />
            <LabStatCard icon={<Stethoscope size={18}/>} tone="blue" label="Diagnósticos abiertos" value={diagnosticos} trend={12} subtitle="vs. semana anterior" />
            <LabStatCard icon={<CheckCircle2 size={18}/>} tone="green" label="Vehículos finalizados" value={finalizados} trend={18} subtitle="vs. semana anterior" />
          </div>

          <LabPanel padded={false}>
            <div className="grid gap-2 border-b border-white/[0.065] p-3 xl:grid-cols-[minmax(220px,1fr)_140px_140px_auto_160px]">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2"><Search size={14} className="text-zinc-600"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por matrícula o VIN..." className="w-full border-0 bg-transparent p-0 text-[11px] outline-none"/></div>
              <select value={marcaFiltro} onChange={(e)=>setMarcaFiltro(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px]"><option value="todas">Marca: Todas</option>{marcas.map((m)=><option key={m} value={m}>{m}</option>)}</select>
              <select value={estadoFiltro} onChange={(e)=>setEstadoFiltro(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px]"><option value="todos">Estado: Todos</option><option value="en taller">En taller</option><option value="diagnóstico">Diagnóstico</option><option value="pendiente">Pendiente</option><option value="finalizado">Finalizado</option></select>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px] text-zinc-300"><SlidersHorizontal size={13}/>Más filtros</button>
              <button onClick={()=>{setEditing(null);setModalOpen(true)}} className="flex items-center justify-center gap-1.5 rounded-lg bg-[#b92028] px-3 py-2 text-[11px] font-semibold text-white"><Plus size={13}/>Nuevo vehículo</button>
            </div>

            <div className="px-4 pt-4 text-[11px] font-semibold text-zinc-300">Listado de vehículos <span className="text-zinc-600">({filtered.length})</span></div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead><tr className="text-left text-[8px] uppercase tracking-[.08em] text-zinc-600"><th className="px-4 py-3">Matrícula</th><th className="px-3 py-3">VIN</th><th className="px-3 py-3">Marca / Modelo</th><th className="px-3 py-3">Año</th><th className="px-3 py-3">Kilometraje</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Trabajo actual</th></tr></thead>
                <tbody>{filtered.slice(0,10).map((v)=>{const exp=expedientesPorVehiculo.get(v.id);const b=estadoVehiculo(exp);return <tr key={v.id} onClick={()=>setSelectedId(v.id)} className={`cursor-pointer border-t border-white/[0.055] hover:bg-white/[0.025] ${selectedId===v.id?'bg-white/[0.018]':''}`}><td className="px-4 py-2.5 font-medium text-zinc-200">{v.matricula||'—'}</td><td className="px-3 py-2.5 font-mono text-[9px] text-zinc-500">{v.bastidor||'—'}</td><td className="px-3 py-2.5 text-zinc-300">{[v.marca,v.modelo].filter(Boolean).join(' ')||'—'}</td><td className="px-3 py-2.5 text-zinc-400">{v.anio||'—'}</td><td className="px-3 py-2.5 text-zinc-400">—</td><td className="px-3 py-2.5"><LabBadge tone={b.tone}>{b.label}</LabBadge></td><td className="px-3 py-2.5 text-zinc-400">{exp?.tipo_trabajo||'—'}</td></tr>})}</tbody>
              </table>
              {!loading && filtered.length===0 && <div className="py-10 text-center text-[10px] text-zinc-600">Ningún vehículo coincide con esos filtros.</div>}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.055] px-4 py-3 text-[9px] text-zinc-500"><div className="flex gap-1"><button className="rounded border border-white/[0.08] px-2 py-1.5">‹ Anterior</button><button className="rounded border border-[#bf232b] bg-[#8e181f] px-2.5 py-1.5 text-white">1</button><button className="rounded border border-white/[0.08] px-2.5 py-1.5">2</button><button className="rounded border border-white/[0.08] px-2.5 py-1.5">3</button><button className="rounded border border-white/[0.08] px-2 py-1.5">Siguiente ›</button></div><span>Mostrando 1 a {Math.min(filtered.length,10)} de {filtered.length} vehículos</span></div>
          </LabPanel>
        </div>

        <LabPanel className="min-h-[650px]" title={selected ? <div><div className="text-[8px] font-medium uppercase tracking-[.08em] text-zinc-600">Matrícula</div><div className="mt-1 text-[18px] font-semibold text-white">{selected.matricula||'—'}</div></div> : 'Detalle del vehículo'} action={selected&&<div className="flex gap-2"><button onClick={()=>{setEditing(selected);setModalOpen(true)}} className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[9px] text-zinc-300">Editar</button><button className="rounded-md border border-white/[0.08] p-1.5 text-zinc-500"><MoreVertical size={13}/></button></div>}>
          {!selected ? <div className="py-16 text-center text-[10px] text-zinc-600">Selecciona un vehículo.</div> : <div className="space-y-4">
            <div className="flex items-center justify-between"><div><div className="text-[12px] font-medium text-zinc-200">{[selected.marca,selected.modelo].filter(Boolean).join(' ')||'Vehículo'}</div><div className="mt-2"><LabBadge tone={badge.tone}>{badge.label}</LabBadge></div></div><div className="grid h-[92px] w-[170px] place-items-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,.08),transparent_62%)]"><Car size={74} strokeWidth={1} className="text-zinc-500"/></div></div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-white/[0.06] pt-3 text-[9px]"><div><span className="text-zinc-600">VIN</span><div className="truncate font-mono text-zinc-300">{selected.bastidor||'—'}</div></div><div><span className="text-zinc-600">Cliente</span><div className="text-zinc-300">{selected.clientes?.nombre||'—'}</div></div><div><span className="text-zinc-600">Año</span><div className="text-zinc-300">{selected.anio||'—'}</div></div><div><span className="text-zinc-600">Teléfono</span><div className="text-zinc-300">{selected.clientes?.telefono||'—'}</div></div><div><span className="text-zinc-600">Motor</span><div className="text-zinc-300">{selected.motor||'—'}</div></div><div><span className="text-zinc-600">Trabajo actual</span><div className="text-zinc-300">{selectedExp?.tipo_trabajo||'—'}</div></div></div>

            <div className="border-t border-white/[0.06] pt-3"><div className="mb-2 flex items-center justify-between text-[9px]"><span className="font-semibold text-zinc-300">Módulos / ECUs vinculadas</span><span className="text-zinc-600">6 módulos ›</span></div><div className="grid grid-cols-3 gap-2 text-[8px]">{[['ECU Motor',selected.ecu||'—'],['TCU',selected.software||'—'],['ABS / ESP','—'],['Airbag','—'],['Inmovilizador',selected.hardware||'—'],['Cuadro','—']].map(([name,val])=><div key={name} className="rounded-md border border-white/[0.06] bg-white/[0.018] p-2"><div className="text-zinc-300">{name}</div><div className="mt-1 truncate text-zinc-600">{val}</div></div>)}</div></div>

            <div className="grid gap-3 border-t border-white/[0.06] pt-3 lg:grid-cols-2"><div className="rounded-md border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-2 text-[9px] font-semibold text-zinc-300">Notas técnicas</div><div className="whitespace-pre-line text-[8px] leading-4 text-zinc-500">{selected.notas||'• Sin notas técnicas registradas.\n• Añade observaciones desde Editar.'}</div></div><div className="rounded-md border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-2 flex justify-between text-[9px]"><span className="font-semibold text-zinc-300">Historial de servicios</span><Link href={`/vehiculos/${selected.id}`} className="text-zinc-600">Ver todo</Link></div><div className="space-y-2">{historial.slice(0,3).map((h)=><div key={h.id} className="flex justify-between text-[8px]"><div><div className="text-zinc-300">{h.tipo_trabajo||'Trabajo'}</div><div className="text-zinc-600">{new Date(h.created_at).toLocaleDateString('es-ES')}</div></div><div className="text-right text-zinc-600">{h.tecnico||'—'}</div></div>)}</div></div></div>

            <div className="grid grid-cols-5 gap-2 border-t border-white/[0.06] pt-3 text-[8px]"><Link href={`/expedientes/nueva?vehiculo=${selected.id}`} className="flex items-center justify-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-zinc-300"><ClipboardList size={11} className="text-[#ef202d]"/>Nueva orden</Link><button className="flex items-center justify-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-zinc-300"><Stethoscope size={11}/>Diagnóstico</button><button className="flex items-center justify-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-zinc-300"><FileSearch size={11}/>Lectura DTC</button><button className="flex items-center justify-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-2 text-zinc-300"><FileBarChart size={11}/>Informe</button><button onClick={()=>toast.success('Trabajo marcado como finalizado')} className="flex items-center justify-center gap-1 rounded-md bg-[#b92028] px-2 py-2 font-semibold text-white"><CheckCircle size={11}/>Finalizar</button></div>
          </div>}
        </LabPanel>
      </div>

      <VehiculoModal open={modalOpen} vehiculo={editing} clientes={clientes} saving={saving} onClose={()=>{setModalOpen(false);setEditing(null)}} onSave={saveVehiculo}/>
    </LabShell>
  )
}
