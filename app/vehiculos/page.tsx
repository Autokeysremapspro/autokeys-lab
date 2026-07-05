'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Car, Edit3, Eye, FileText, Gauge, Plus, Search, Trash2, User } from 'lucide-react'
import AppShell from '@/components/AppShell'
import VehiculoModal from '@/components/VehiculoModal'
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

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return vehiculos
    return vehiculos.filter(vehiculo => [
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
  }, [vehiculos, query])

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

  async function deleteVehiculo(vehiculo: Vehiculo) {
    const title = [vehiculo.marca, vehiculo.modelo, vehiculo.matricula].filter(Boolean).join(' ') || 'este vehículo'

    const { count, error: countError } = await supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('vehiculo_id', vehiculo.id)

    if (countError) {
      toast.error(countError.message)
      return
    }

    if ((count || 0) > 0) {
      const force = confirm(`${title} tiene ${count} expediente(s) asociado(s).\n\nRecomendación: no eliminar vehículos con historial real.\n\n¿Quieres eliminar SOLO si es un dato de prueba? Esto también desvinculará sus expedientes.`)
      if (!force) return

      const { error: unlinkError } = await supabase
        .from('expedientes')
        .update({ vehiculo_id: null })
        .eq('vehiculo_id', vehiculo.id)

      if (unlinkError) {
        toast.error(unlinkError.message)
        return
      }
    } else {
      if (!confirm(`¿Eliminar definitivamente ${title}?`)) return
    }

    const { error } = await supabase.from('vehiculos').delete().eq('id', vehiculo.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Vehículo eliminado')
      loadData()
    }
  }

  const conEcu = vehiculos.filter(v => v.ecu).length
  const sinCliente = vehiculos.filter(v => !v.cliente_id).length

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <Car size={14} /> Vehículos
          </div>
          <h2 className="text-3xl font-black tracking-tight">Vehículos</h2>
          <p className="mt-1 text-zinc-500">Alta, búsqueda, ficha técnica y relación directa con clientes y expedientes.</p>
        </div>
        <button onClick={openCreate} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo vehículo
        </button>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_180px_180px_180px]">
        <div className="card flex items-center gap-3 p-4">
          <Search className="text-zinc-500" size={20} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar matrícula, VIN, cliente, motor, ECU, HW, SW..." className="w-full border-0 bg-transparent p-0" />
        </div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Vehículos</p><p className="mt-1 text-2xl font-black">{vehiculos.length}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Con ECU</p><p className="mt-1 text-2xl font-black">{conEcu}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sin cliente</p><p className="mt-1 text-2xl font-black">{sinCliente}</p></div>
      </div>

      {loading ? <div className="card p-8 text-zinc-500">Cargando vehículos...</div> : filtered.length === 0 ? <div className="card p-8 text-zinc-500">No hay vehículos que coincidan con la búsqueda.</div> : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map(vehiculo => {
            const title = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin modelo'
            return (
              <div key={vehiculo.id} className="card p-5 transition hover:-translate-y-0.5 hover:border-red-500/35">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-400"><Gauge size={14} /> {vehiculo.matricula || 'Sin matrícula'}</div>
                    <h3 className="mt-2 text-xl font-black">{title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{vehiculo.motor || 'Motor sin definir'} · {vehiculo.anio || 'Año —'}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/15 text-red-400"><Car size={24} /></div>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="rounded-2xl bg-black/20 p-3"><div className="flex items-center gap-2 text-zinc-500"><User size={15} /> Cliente</div><div className="mt-1 font-bold text-zinc-200">{vehiculo.clientes?.nombre || 'Sin cliente asignado'}</div></div>
                  <div className="rounded-2xl bg-black/20 p-3"><div className="flex items-center gap-2 text-zinc-500"><FileText size={15} /> VIN / ECU</div><div className="mt-1 truncate font-bold text-zinc-200">{vehiculo.bastidor || 'VIN —'} · {vehiculo.ecu || 'ECU —'}</div></div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/vehiculos/${vehiculo.id}`} className="btn btn-red inline-flex items-center gap-2 text-sm"><Eye size={15} /> Abrir ficha</Link>
                  <button onClick={() => openEdit(vehiculo)} className="btn btn-dark inline-flex items-center gap-2 text-sm"><Edit3 size={15} /> Editar</button>
                  <button onClick={() => deleteVehiculo(vehiculo)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300"><Trash2 size={15} /> Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <<VehiculoModal
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
  )
}
