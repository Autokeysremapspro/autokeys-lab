'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Car, Edit3, Eye, FileText, Gauge, Plus, Search, Trash2, User } from 'lucide-react'
import AppShell from '@/components/AppShell'
import VehiculoModal from '@/components/VehiculoModal'
import ConfirmModal from '@/components/ConfirmModal'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
}

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

type QuickFilter = 'todos' | 'ecu' | 'sin_cliente'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ vehiculo: Vehiculo; expedientesCount: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [vehiculosRes, clientesRes] = await Promise.all([
      supabase
        .from('vehiculos')
        .select(`
          *,
          clientes:cliente_id (
            id,
            nombre,
            telefono
          )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('clientes')
        .select('id,nombre,telefono')
        .order('nombre', { ascending: true })
    ])

    if (vehiculosRes.error) toast.error(vehiculosRes.error.message)
    if (clientesRes.error) toast.error(clientesRes.error.message)

    setVehiculos((vehiculosRes.data || []) as Vehiculo[])
    setClientes((clientesRes.data || []) as Cliente[])
    setLoading(false)
  }

  const conEcu = vehiculos.filter(v => v.ecu).length
  const sinCliente = vehiculos.filter(v => !v.cliente_id).length

  const filtered = useMemo(() => {
    let out = vehiculos
    if (quickFilter === 'ecu') out = out.filter(v => v.ecu)
    if (quickFilter === 'sin_cliente') out = out.filter(v => !v.cliente_id)

    const q = query.trim().toLowerCase()
    if (!q) return out
    return out.filter(vehiculo => [
      vehiculo.marca,
      vehiculo.modelo,
      vehiculo.motor,
      vehiculo.matricula,
      vehiculo.bastidor,
      vehiculo.ecu,
      vehiculo.hardware,
      vehiculo.software,
      vehiculo.clientes?.nombre,
      vehiculo.clientes?.telefono
    ].some(value => (value || '').toLowerCase().includes(q)))
  }, [vehiculos, query, quickFilter])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(vehiculo: Vehiculo) {
    setEditing(vehiculo)
    setModalOpen(true)
  }

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
      notas: payload.notas || null
    }

    const { error } = editing
      ? await supabase.from('vehiculos').update(cleanPayload).eq('id', editing.id)
      : await supabase.from('vehiculos').insert(cleanPayload)

    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(editing ? 'Vehículo actualizado' : 'Vehículo creado')
    setModalOpen(false)
    setEditing(null)
    loadData()
  }

  async function askDelete(vehiculo: Vehiculo) {
    const { count, error: countError } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('vehiculo_id', vehiculo.id)

    if (countError) {
      toast.error(countError.message)
      return
    }

    setPendingDelete({ vehiculo, expedientesCount: count || 0 })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { vehiculo, expedientesCount } = pendingDelete
    setDeleting(true)

    if (expedientesCount > 0) {
      const { error: unlinkError } = await supabase
        .from('expedientes')
        .update({ vehiculo_id: null })
        .eq('vehiculo_id', vehiculo.id)

      if (unlinkError) {
        toast.error(unlinkError.message)
        setDeleting(false)
        return
      }
    }

    const { error } = await supabase.from('vehiculos').delete().eq('id', vehiculo.id)
    setDeleting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Vehículo eliminado')
    setPendingDelete(null)
    loadData()
  }

  const filtros: { key: QuickFilter; label: string; value: number }[] = [
    { key: 'todos', label: 'Vehículos', value: vehiculos.length },
    { key: 'ecu', label: 'Con ECU', value: conEcu },
    { key: 'sin_cliente', label: 'Sin cliente', value: sinCliente },
  ]

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e2954d]/25 bg-[#e2954d]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb870]">
            <Car size={14} /> Vehículos
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Vehículos</h2>
          <p className="mt-1 text-zinc-500">Alta, búsqueda, ficha técnica y relación directa con clientes y expedientes.</p>
        </div>
        <button onClick={openCreate} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo vehículo
        </button>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_180px_180px]">
        <div className="card flex items-center gap-3 p-4">
          <Search className="text-zinc-500" size={20} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar matrícula, VIN, cliente, motor, ECU, HW, SW..." className="w-full border-0 bg-transparent p-0" />
        </div>
        {filtros.map((f) => {
          const active = quickFilter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setQuickFilter(f.key)}
              className={`card p-4 text-left transition ${active ? 'border-[#e2954d]/60 bg-[#e2954d]/[.08]' : 'hover:border-[#e2954d]/25'}`}
            >
              <p className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-[#ffb870]' : 'text-zinc-500'}`}>{f.label}</p>
              <p className="mt-1 text-2xl font-bold">{f.value}</p>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-44 animate-pulse p-5"><div className="h-full rounded-2xl bg-white/5" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          {vehiculos.length === 0 ? 'Todavía no hay vehículos — crea el primero con "Nuevo vehículo".' : 'Ningún vehículo coincide con estos filtros.'}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map(vehiculo => {
            const title = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin modelo'
            return (
              <div key={vehiculo.id} className="card p-5 transition hover:-translate-y-0.5 hover:border-[#e2954d]/35">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ffb870]"><Gauge size={14} /> {vehiculo.matricula || 'Sin matrícula'}</div>
                    <h3 className="mt-2 text-xl font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{vehiculo.motor || 'Motor sin definir'} · {vehiculo.anio || 'Año —'}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e2954d]/15 text-[#ffb870]"><Car size={24} /></div>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="rounded-2xl bg-black/20 p-3"><div className="flex items-center gap-2 text-zinc-500"><User size={15} /> Cliente</div><div className="mt-1 font-bold text-zinc-200">{vehiculo.clientes?.nombre || 'Sin cliente asignado'}</div></div>
                  <div className="rounded-2xl bg-black/20 p-3"><div className="flex items-center gap-2 text-zinc-500"><FileText size={15} /> VIN / ECU</div><div className="mt-1 truncate font-bold text-zinc-200">{vehiculo.bastidor || 'VIN —'} · {vehiculo.ecu || 'ECU —'}</div></div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/vehiculos/${vehiculo.id}`} className="btn btn-red inline-flex items-center gap-2 text-sm"><Eye size={15} /> Abrir ficha</Link>
                  <button onClick={() => openEdit(vehiculo)} className="btn btn-dark inline-flex items-center gap-2 text-sm"><Edit3 size={15} /> Editar</button>
                  <button onClick={() => askDelete(vehiculo)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300"><Trash2 size={15} /> Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <VehiculoModal
        open={modalOpen}
        clientes={clientes}
        initialData={editing || undefined}
        loading={saving}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={saveVehiculo}
      />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar ${[pendingDelete?.vehiculo.marca, pendingDelete?.vehiculo.modelo, pendingDelete?.vehiculo.matricula].filter(Boolean).join(' ') || 'este vehículo'}`}
        description={
          pendingDelete && pendingDelete.expedientesCount > 0
            ? `Este vehículo tiene ${pendingDelete.expedientesCount} expediente(s) asociado(s). No se recomienda eliminar vehículos con historial real — si continúas, esos expedientes se quedarán sin vehículo asignado.`
            : 'Se eliminará la ficha del vehículo definitivamente.'
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  )
}
