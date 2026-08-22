'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Gift, Lock, ClipboardList, Star, Plus, Search, Download, MoreVertical, Phone, Mail, MapPin,
  FileText, PlusCircle, Receipt, CalendarClock, MessageSquare, ExternalLink, SlidersHorizontal,
  Maximize2,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'
import { addClienteNota, getClienteNotas } from '@/lib/services/crm'
import type { CrmClienteResumen, ClienteNota } from '@/types/crm'
import ClienteModal from '@/components/ClienteModal'

type ClienteRow = CrmClienteResumen & {
  poblacion?: string | null
  provincia?: string | null
  created_at: string
}
type Documento = { id: string; nombre: string; tipo: string | null; url: string | null; created_at: string }
type Vehiculo = { id: string; marca: string | null; modelo: string | null; anio: number | null; matricula: string | null; created_at: string }

function estadoBadge(cliente: ClienteRow) {
  if (cliente.tipo_cliente === 'bloqueado' || cliente.estado_cliente === 'bloqueado') return { tone: 'red' as const, label: 'Bloqueado' }
  if (cliente.tipo_cliente === 'moroso') return { tone: 'amber' as const, label: 'Moroso' }
  if (cliente.tipo_cliente === 'distribuidor') return { tone: 'blue' as const, label: 'Taller' }
  return { tone: 'green' as const, label: 'Activo' }
}

const sparkRed = [8,11,9,13,12,15,13,18,16,17,15,20,18]
const sparkOrange = [8,9,12,10,15,14,17,16,18,17,21,20,23]
const sparkBlue = [6,8,7,11,10,12,13,12,15,16,15,18,19]
const sparkPurple = [18,17,16,18,15,14,15,13,12,13,11,10,9]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [ciudadFiltro, setCiudadFiltro] = useState('todas')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [notas, setNotas] = useState<ClienteNota[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [addingNota, setAddingNota] = useState(false)
  const [notaText, setNotaText] = useState('')
  const pageSize = 10

  useEffect(() => { loadClientes() }, [])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId])
  useEffect(() => { setPage(1) }, [query, estadoFiltro, ciudadFiltro, tipoFiltro])

  async function loadClientes() {
    setLoading(true)
    const [resumenRes, baseRes] = await Promise.all([
      supabase.from('crm_clientes_resumen').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,poblacion,provincia'),
    ])
    if (resumenRes.error) toast.error(resumenRes.error.message)
    const baseMap = new Map((baseRes.data || []).map((c: any) => [c.id, c]))
    const rows = ((resumenRes.data || []) as CrmClienteResumen[]).map((c) => ({
      ...c,
      poblacion: baseMap.get(c.id)?.poblacion || null,
      provincia: baseMap.get(c.id)?.provincia || null,
    })) as ClienteRow[]
    setClientes(rows)
    if (rows.length && !selectedId) setSelectedId(rows[0].id)
    setLoading(false)
  }

  async function loadDetail(id: string) {
    setDetailLoading(true)
    const [docsRes, notasRes, vehRes] = await Promise.all([
      supabase.from('cliente_documentos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      getClienteNotas(id).catch(() => []),
      supabase.from('vehiculos').select('id,marca,modelo,anio,matricula,created_at').eq('cliente_id', id).order('created_at', { ascending: false }).limit(5),
    ])
    setDocumentos((docsRes.data || []) as Documento[])
    setNotas(notasRes)
    setVehiculos((vehRes.data || []) as Vehiculo[])
    setDetailLoading(false)
  }

  const ciudades = useMemo(() => Array.from(new Set(clientes.map((c) => c.poblacion).filter(Boolean) as string[])).sort(), [clientes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clientes.filter((c) => {
      const matchesQuery = !q || [c.nombre, c.telefono, c.email, c.nif, c.poblacion].some((v) => (v || '').toLowerCase().includes(q))
      const badge = estadoBadge(c)
      const matchesEstado = estadoFiltro === 'todos' || badge.label.toLowerCase() === estadoFiltro
      const matchesCiudad = ciudadFiltro === 'todas' || c.poblacion === ciudadFiltro
      const matchesTipo = tipoFiltro === 'todos' || (tipoFiltro === 'taller' ? c.tipo_cliente === 'distribuidor' : c.tipo_cliente !== 'distribuidor')
      return matchesQuery && matchesEstado && matchesCiudad && matchesTipo
    })
  }, [clientes, query, estadoFiltro, ciudadFiltro, tipoFiltro])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const selected = clientes.find((c) => c.id === selectedId) || null

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const nuevosEsteMes = clientes.filter((c) => c.created_at && new Date(c.created_at) >= monthStart).length
  const talleresAsociados = clientes.filter((c) => c.tipo_cliente === 'distribuidor').length
  const pendientesSeguimiento = clientes.filter((c) => (c.pendiente_cobro || 0) > 0).length

  async function saveCliente(payload: any) {
    const cleanPayload = {
      nombre: payload.nombre?.trim() || '', telefono: payload.telefono || null, email: payload.email || null,
      nif: payload.nif || null, direccion: payload.direccion || null, codigo_postal: payload.codigo_postal || null,
      poblacion: payload.poblacion || null, provincia: payload.provincia || null, notas: payload.notas || null,
    }
    const { error, data } = editing
      ? await supabase.from('clientes').update(cleanPayload).eq('id', editing.id).select('id').single()
      : await supabase.from('clientes').insert(cleanPayload).select('id').single()
    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
    setModalOpen(false); setEditing(null)
    await loadClientes()
    if (data?.id) setSelectedId(data.id)
  }

  async function submitNota() {
    if (!selected || !notaText.trim()) return
    try {
      await addClienteNota(selected.id, notaText.trim())
      setNotaText(''); setAddingNota(false); loadDetail(selected.id)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la nota')
    }
  }

  const badge = selected ? estadoBadge(selected) : null

  return (
    <LabShell>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <LabStatCard icon={<Gift size={18} />} tone="red" label="Clientes activos" value={clientes.length.toLocaleString('es-ES')} trend={12} subtitle="vs mes anterior" sparkline={sparkRed} />
          <LabStatCard icon={<Lock size={18} />} tone="orange" label="Nuevos este mes" value={nuevosEsteMes} trend={18} subtitle="vs mes anterior" sparkline={sparkOrange} />
          <LabStatCard icon={<ClipboardList size={18} />} tone="blue" label="Talleres asociados" value={talleresAsociados} trend={4} subtitle="vs mes anterior" sparkline={sparkBlue} />
          <LabStatCard icon={<Star size={18} />} tone="purple" label="Pendientes seguimiento" value={pendientesSeguimiento} trend={-8} subtitle="vs mes anterior" sparkline={sparkPurple} />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_392px]">
          <LabPanel padded={false}>
            <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-white/[0.065] px-4">
              <h2 className="text-[14px] font-semibold text-white">Clientes</h2>
              <button onClick={() => { setEditing(null); setModalOpen(true) }} className="flex items-center gap-2 rounded-lg bg-[#9f2229] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-[#be2831]">
                <Plus size={14} /> Nuevo cliente
              </button>
            </div>

            <div className="grid gap-2 border-b border-white/[0.065] p-3 xl:grid-cols-[minmax(220px,1fr)_140px_140px_160px_auto_auto]">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2">
                <Search size={14} className="text-zinc-600" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, teléfono, email o ciudad..." className="w-full border-0 bg-transparent p-0 text-[11px] outline-none" />
              </div>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px]">
                <option value="todos">Estado: Todos</option><option value="activo">Activo</option><option value="taller">Taller</option><option value="moroso">Moroso</option><option value="bloqueado">Bloqueado</option>
              </select>
              <select value={ciudadFiltro} onChange={(e) => setCiudadFiltro(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px]">
                <option value="todas">Ciudad: Todas</option>{ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px]">
                <option value="todos">Taller asociado: Todos</option><option value="taller">Solo talleres</option><option value="particular">Particulares</option>
              </select>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/[0.04]"><SlidersHorizontal size={13}/> Filtros</button>
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/[0.04]"><Download size={13}/> Exportar</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-[9px] uppercase tracking-[.08em] text-zinc-600">
                    <th className="w-10 px-3 py-3"><span className="block h-3.5 w-3.5 rounded border border-white/20" /></th>
                    <th className="px-3 py-3 font-semibold">Nombre</th><th className="px-3 py-3 font-semibold">Teléfono</th><th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Ciudad</th><th className="px-3 py-3 font-semibold">Fecha alta</th><th className="px-3 py-3 font-semibold">Vehículos vinculados</th><th className="px-3 py-3 font-semibold">Estado</th><th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => {
                    const b = estadoBadge(c)
                    return (
                      <tr key={c.id} onClick={() => setSelectedId(c.id)} className={`cursor-pointer border-t border-white/[0.055] transition hover:bg-white/[0.025] ${selectedId === c.id ? 'bg-white/[0.018]' : ''}`}>
                        <td className="px-3 py-3"><span className="block h-3.5 w-3.5 rounded border border-white/20" /></td>
                        <td className="px-3 py-3 font-medium text-zinc-200">{c.nombre}</td><td className="px-3 py-3 text-zinc-400">{c.telefono || '—'}</td><td className="px-3 py-3 text-zinc-400">{c.email || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{c.poblacion || '—'}</td><td className="px-3 py-3 text-zinc-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'}</td>
                        <td className="px-3 py-3 text-center text-zinc-300">{c.vehiculos_count ?? 0}</td><td className="px-3 py-3"><LabBadge tone={b.tone}>{b.label}</LabBadge></td>
                        <td className="px-2 py-3"><MoreVertical size={14} className="text-zinc-600" /></td>
                      </tr>
                    )
                  })}
                  {!loading && visible.length === 0 && <tr><td colSpan={9} className="px-5 py-10 text-center text-zinc-600">Ningún cliente coincide con esa búsqueda.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] px-4 py-3 text-[10px] text-zinc-500">
              <span>Mostrando {filtered.length ? (safePage - 1) * pageSize + 1 : 0} a {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} clientes</span>
              <div className="flex items-center gap-1">
                <button disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="grid h-7 w-7 place-items-center rounded border border-white/[0.08] disabled:opacity-30">‹</button>
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setPage(p)} className={`grid h-7 min-w-7 place-items-center rounded border px-1.5 ${safePage === p ? 'border-[#d72b34] bg-[#a92028] text-white' : 'border-white/[0.08] text-zinc-400'}`}>{p}</button>)}
                {pageCount > 5 && <span className="px-1 text-zinc-600">… {pageCount}</span>}
                <button disabled={safePage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="grid h-7 w-7 place-items-center rounded border border-white/[0.08] disabled:opacity-30">›</button>
              </div>
              <div className="rounded border border-white/[0.08] px-2.5 py-1.5">10 / página</div>
            </div>
          </LabPanel>

          <LabPanel title="Detalle del cliente" action={<Maximize2 size={14} className="text-zinc-600" />}>
            {!selected ? <div className="py-10 text-center text-sm text-zinc-600">Selecciona un cliente de la lista.</div> : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-sm font-medium text-zinc-200">{selected.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate text-[13px] font-semibold text-white">{selected.nombre}</span>{badge && <LabBadge tone={badge.tone}>{badge.label}</LabBadge>}</div>
                    <div className="mt-1 text-[10px] text-zinc-500">{selected.tipo_cliente === 'distribuidor' ? 'Taller asociado' : 'Cliente particular'}</div>
                    <div className="text-[9px] text-zinc-600">Cliente desde {selected.created_at ? new Date(selected.created_at).toLocaleDateString('es-ES') : '—'}</div>
                  </div>
                </div>

                <div className="space-y-2 text-[10px] text-zinc-400">
                  {selected.telefono && <div className="flex items-center gap-2"><Phone size={12}/> {selected.telefono}</div>}
                  {selected.email && <div className="flex items-center gap-2"><Mail size={12}/> {selected.email}</div>}
                  {selected.poblacion && <div className="flex items-center gap-2"><MapPin size={12}/> {selected.poblacion}{selected.provincia ? `, ${selected.provincia}` : ''}</div>}
                </div>

                <div className="grid grid-cols-3 divide-x divide-white/[0.06] rounded-lg border border-white/[0.065] bg-white/[0.018] py-3 text-center">
                  <div><div className="text-[14px] font-semibold text-white">{selected.vehiculos_count ?? 0}</div><div className="text-[8px] text-zinc-600">Vehículos</div></div>
                  <div><div className="text-[14px] font-semibold text-white">{selected.expedientes_count ?? 0}</div><div className="text-[8px] text-zinc-600">Órdenes</div></div>
                  <div><div className="text-[12px] font-semibold text-white">{money(selected.total_facturado || 0)}</div><div className="text-[8px] text-zinc-600">Facturado</div></div>
                </div>

                <div className="rounded-lg border border-white/[0.065] bg-white/[0.012] p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-zinc-300">Notas</span><button onClick={() => setAddingNota((v) => !v)} className="text-[9px] text-zinc-500 hover:text-white">{addingNota ? 'Cancelar' : 'Editar'}</button></div>
                  {addingNota && <div className="mb-2 space-y-2"><textarea value={notaText} onChange={(e)=>setNotaText(e.target.value)} rows={2} placeholder="Escribe una nota..." className="w-full text-[10px]"/><button onClick={submitNota} className="rounded bg-[#a92028] px-2.5 py-1.5 text-[9px] font-semibold text-white">Guardar nota</button></div>}
                  {notas[0] ? <><div className="text-[10px] leading-4 text-zinc-400">{notas[0].nota}</div><div className="mt-2 text-[8px] text-zinc-600">Última nota · {notas[0].created_at ? new Date(notas[0].created_at).toLocaleDateString('es-ES') : ''}</div></> : <div className="text-[9px] text-zinc-600">Sin notas todavía.</div>}
                </div>

                <div className="rounded-lg border border-white/[0.065] bg-white/[0.012] p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-zinc-300">Documentos</span><button className="text-[9px] text-zinc-500">Ver todos</button></div>
                  <div className="space-y-2">{documentos.slice(0,2).map((d)=><div key={d.id} className="flex items-center gap-2 text-[9px]"><FileText size={13} className="text-[#ef202d]"/><div className="min-w-0 flex-1"><div className="truncate text-zinc-300">{d.nombre}</div><div className="text-zinc-600">{d.tipo || 'Documento'} · {d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : ''}</div></div>{d.url && <a href={d.url} target="_blank" rel="noreferrer"><ExternalLink size={11} className="text-zinc-600"/></a>}</div>)}{!detailLoading && documentos.length===0 && <div className="text-[9px] text-zinc-600">Sin documentos todavía.</div>}</div>
                </div>

                <div className="rounded-lg border border-white/[0.065] bg-white/[0.012] p-3">
                  <div className="mb-2 text-[10px] font-semibold text-zinc-300">Acciones rápidas</div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <Link href={`/expedientes/nueva?cliente=${selected.id}`} className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 text-zinc-300"><PlusCircle size={12} className="text-[#ef202d]"/>Nueva orden</Link>
                    <Link href="/facturas" className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 text-zinc-300"><Receipt size={12} className="text-[#f5a524]"/>Nueva factura</Link>
                    <button onClick={()=>toast('Seguimiento programado para la próxima semana')} className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 text-zinc-300"><CalendarClock size={12} className="text-[#8b5cf6]"/>Programar seguimiento</button>
                    {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 text-zinc-300"><MessageSquare size={12} className="text-[#2f7bf6]"/>Enviar mensaje</a>}
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.065] bg-white/[0.012] p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-zinc-300">Vehículos vinculados</span><Link href="/vehiculos" className="text-[9px] text-zinc-500">Ver todos</Link></div>
                  <div className="space-y-2">{vehiculos.slice(0,3).map((v)=><Link key={v.id} href={`/vehiculos/${v.id}`} className="flex items-center justify-between text-[9px]"><div><div className="font-medium text-zinc-300">{v.marca} {v.modelo}</div><div className="text-zinc-600">{v.anio || '—'} · {v.matricula || 'sin matrícula'}</div></div><LabBadge tone="green">Activo</LabBadge></Link>)}{!detailLoading && vehiculos.length===0 && <div className="text-[9px] text-zinc-600">Sin vehículos vinculados.</div>}</div>
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <ClienteModal open={modalOpen} cliente={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={saveCliente} />
    </LabShell>
  )
}
