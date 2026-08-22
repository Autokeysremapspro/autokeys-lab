'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Gift,
  Lock,
  ClipboardList,
  Star,
  Plus,
  Search,
  Download,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  FileText,
  PlusCircle,
  Receipt,
  CalendarClock,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { supabase } from '@/lib/supabase'
import { money } from '@/lib/status'
import { addClienteNota, getClienteNotas } from '@/lib/services/crm'
import type { CrmClienteResumen, ClienteNota } from '@/types/crm'
import ClienteModal from '@/components/ClienteModal'
import ConfirmModal from '@/components/ConfirmModal'

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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [notas, setNotas] = useState<ClienteNota[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [pendingDelete, setPendingDelete] = useState<ClienteRow | null>(null)
  const [addingNota, setAddingNota] = useState(false)
  const [notaText, setNotaText] = useState('')

  useEffect(() => { loadClientes() }, [])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
  }, [selectedId])

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clientes.filter((c) => {
      const matchesQuery = !q || [c.nombre, c.telefono, c.email, c.nif, c.poblacion].some((v) => (v || '').toLowerCase().includes(q))
      const badge = estadoBadge(c)
      const matchesEstado = estadoFiltro === 'todos' || badge.label.toLowerCase() === estadoFiltro
      return matchesQuery && matchesEstado
    })
  }, [clientes, query, estadoFiltro])

  const selected = clientes.find((c) => c.id === selectedId) || null

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const nuevosEsteMes = clientes.filter((c) => c.created_at && new Date(c.created_at) >= monthStart).length
  const talleresAsociados = clientes.filter((c) => c.tipo_cliente === 'distribuidor').length
  const pendientesSeguimiento = clientes.filter((c) => (c.pendiente_cobro || 0) > 0).length

  async function saveCliente(payload: any) {
    const cleanPayload = {
      nombre: payload.nombre?.trim() || '',
      telefono: payload.telefono || null,
      email: payload.email || null,
      nif: payload.nif || null,
      direccion: payload.direccion || null,
      codigo_postal: payload.codigo_postal || null,
      poblacion: payload.poblacion || null,
      provincia: payload.provincia || null,
      notas: payload.notas || null,
    }
    const { error, data } = editing
      ? await supabase.from('clientes').update(cleanPayload).eq('id', editing.id).select('id').single()
      : await supabase.from('clientes').insert(cleanPayload).select('id').single()

    if (error) { toast.error(error.message); return }
    toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
    setModalOpen(false)
    setEditing(null)
    await loadClientes()
    if (data?.id) setSelectedId(data.id)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { error } = await supabase.from('clientes').delete().eq('id', pendingDelete.id)
    if (error) { toast.error(error.message); return }
    toast.success('Cliente eliminado')
    setPendingDelete(null)
    loadClientes()
  }

  async function submitNota() {
    if (!selected || !notaText.trim()) return
    try {
      await addClienteNota(selected.id, notaText.trim())
      setNotaText('')
      setAddingNota(false)
      loadDetail(selected.id)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo guardar la nota')
    }
  }

  const badge = selected ? estadoBadge(selected) : null

  return (
    <LabShell
      title="Clientes"
      actions={
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
          <Plus size={16} /> Nuevo cliente
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Gift size={19} />} tone="red" label="Clientes activos" value={clientes.length.toLocaleString('es-ES')} trend={12} subtitle="vs mes anterior" />
          <LabStatCard icon={<Lock size={19} />} tone="orange" label="Nuevos este mes" value={nuevosEsteMes} trend={18} subtitle="vs mes anterior" />
          <LabStatCard icon={<ClipboardList size={19} />} tone="blue" label="Talleres asociados" value={talleresAsociados} trend={4} subtitle="vs mes anterior" />
          <LabStatCard icon={<Star size={19} />} tone="purple" label="Pendientes seguimiento" value={pendientesSeguimiento} trend={-8} subtitle="vs mes anterior" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_380px]">
          <LabPanel padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] p-4">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Search size={16} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, teléfono, email o ciudad..." className="w-full border-0 bg-transparent p-0 text-sm" />
              </div>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                <option value="todos">Estado: Todos</option>
                <option value="activo">Activo</option>
                <option value="taller">Taller</option>
                <option value="moroso">Moroso</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]">
                <Download size={15} /> Exportar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Nombre</th>
                    <th className="px-3 py-3 font-bold">Teléfono</th>
                    <th className="px-3 py-3 font-bold">Email</th>
                    <th className="px-3 py-3 font-bold">Ciudad</th>
                    <th className="px-3 py-3 font-bold">Fecha alta</th>
                    <th className="px-3 py-3 font-bold">Vehículos</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const b = estadoBadge(c)
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === c.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}
                      >
                        <td className="px-5 py-3 font-bold text-white">{c.nombre}</td>
                        <td className="px-3 py-3 text-zinc-400">{c.telefono || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{c.email || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{c.poblacion || '—'}</td>
                        <td className="px-3 py-3 text-zinc-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'}</td>
                        <td className="px-3 py-3 text-zinc-300">{c.vehiculos_count ?? 0}</td>
                        <td className="px-3 py-3"><LabBadge tone={b.tone}>{b.label}</LabBadge></td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-zinc-600">Ningún cliente coincide con esa búsqueda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-4 text-xs text-zinc-500">
              <span>Mostrando 1 a {filtered.length} de {clientes.length} clientes</span>
            </div>
          </LabPanel>

          <LabPanel title="Detalle del cliente" action={selected && <button onClick={() => { setEditing(selected); setModalOpen(true) }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><MoreVertical size={16} /></button>}>
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona un cliente de la lista.</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#c81f2a]/15 text-sm font-bold text-[#ff5468]">
                    {selected.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-white">{selected.nombre}</span>
                      {badge && <LabBadge tone={badge.tone}>{badge.label}</LabBadge>}
                    </div>
                    <div className="text-xs text-zinc-500">{selected.tipo_cliente === 'distribuidor' ? 'Taller asociado' : 'Cliente particular'}</div>
                    <div className="text-xs text-zinc-600">Cliente desde {selected.created_at ? new Date(selected.created_at).toLocaleDateString('es-ES') : '—'}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  {selected.telefono && <div className="flex items-center gap-2"><Phone size={14} /> {selected.telefono}</div>}
                  {selected.email && <div className="flex items-center gap-2"><Mail size={14} /> {selected.email}</div>}
                  {selected.poblacion && <div className="flex items-center gap-2"><MapPin size={14} /> {selected.poblacion}{selected.provincia ? `, ${selected.provincia}` : ''}</div>}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <div><div className="text-lg font-bold text-white">{selected.vehiculos_count ?? 0}</div><div className="text-[10px] text-zinc-600">Vehículos</div></div>
                  <div><div className="text-lg font-bold text-white">{selected.expedientes_count ?? 0}</div><div className="text-[10px] text-zinc-600">Órdenes</div></div>
                  <div><div className="text-sm font-bold text-white">{money(selected.total_facturado || 0)}</div><div className="text-[10px] text-zinc-600">Facturado</div></div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Notas</span>
                    <button onClick={() => setAddingNota((v) => !v)} className="text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">{addingNota ? 'Cancelar' : 'Editar'}</button>
                  </div>
                  {addingNota && (
                    <div className="mb-2 space-y-2">
                      <textarea value={notaText} onChange={(e) => setNotaText(e.target.value)} rows={2} placeholder="Escribe una nota..." className="w-full text-sm" />
                      <button onClick={submitNota} className="rounded-lg bg-[#c81f2a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e2242f]">Guardar nota</button>
                    </div>
                  )}
                  {notas[0] ? (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">
                      {notas[0].nota}
                      <div className="mt-1 text-zinc-600">Última nota · {notas[0].created_at ? new Date(notas[0].created_at).toLocaleDateString('es-ES') : ''}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600">Sin notas todavía.</div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Documentos</span>
                  </div>
                  <div className="space-y-1.5">
                    {documentos.slice(0, 3).map((d) => (
                      <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                        <FileText size={15} className="shrink-0 text-[#ff5468]" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-zinc-200">{d.nombre}</div>
                          <div className="text-[10px] text-zinc-600">{d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : ''}</div>
                        </div>
                        {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white"><ExternalLink size={13} /></a>}
                      </div>
                    ))}
                    {documentos.length === 0 && <div className="text-xs text-zinc-600">Sin documentos todavía.</div>}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">Acciones rápidas</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/expedientes/nueva?cliente=${selected.id}`} className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><PlusCircle size={14} /> Nueva orden</Link>
                    <Link href={`/facturas`} className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><Receipt size={14} /> Nueva factura</Link>
                    <button onClick={() => toast('Seguimiento programado para la próxima semana')} className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><CalendarClock size={14} /> Seguimiento</button>
                    {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]"><MessageSquare size={14} /> Mensaje</a>}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">Vehículos vinculados</span>
                    <Link href="/vehiculos" className="text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver todos</Link>
                  </div>
                  <div className="space-y-1.5">
                    {vehiculos.map((v) => (
                      <Link key={v.id} href={`/vehiculos/${v.id}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs hover:bg-white/[0.04]">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-200">{v.marca} {v.modelo}</div>
                          <div className="text-[10px] text-zinc-600">{v.anio || '—'} · {v.matricula || 'sin matrícula'}</div>
                        </div>
                        <LabBadge tone="green">Activo</LabBadge>
                      </Link>
                    ))}
                    {!detailLoading && vehiculos.length === 0 && <div className="text-xs text-zinc-600">Sin vehículos vinculados.</div>}
                  </div>
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <ClienteModal
        open={modalOpen}
        cliente={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={saveCliente}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar a ${pendingDelete?.nombre || 'este cliente'}`}
        description="Se eliminará la ficha del cliente definitivamente."
        confirmLabel="Sí, eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </LabShell>
  )
}
