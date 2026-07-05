'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Edit3, Eye, Mail, Phone, Plus, Search, Trash2, Users } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ClienteModal from '@/components/ClienteModal'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  nif: string | null
  direccion: string | null
  codigo_postal: string | null
  poblacion: string | null
  provincia: string | null
  notas: string | null
  created_at: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) toast.error(error.message)
    setClientes((data || []) as Cliente[])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(cliente => [
      cliente.nombre,
      cliente.telefono,
      cliente.email,
      cliente.nif,
      cliente.poblacion,
      cliente.provincia
    ].some(value => (value || '').toLowerCase().includes(q)))
  }, [clientes, query])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente)
    setModalOpen(true)
  }

  async function saveCliente(payload: any) {
    setSaving(true)
    const cleanPayload = {
      ...payload,
      nombre: payload.nombre.trim(),
      telefono: payload.telefono || null,
      email: payload.email || null,
      nif: payload.nif || null,
      direccion: payload.direccion || null,
      codigo_postal: payload.codigo_postal || null,
      poblacion: payload.poblacion || null,
      provincia: payload.provincia || null,
      notas: payload.notas || null
    }

    const { error } = editing
      ? await supabase.from('clientes').update(cleanPayload).eq('id', editing.id)
      : await supabase.from('clientes').insert(cleanPayload)

    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
    setModalOpen(false)
    setEditing(null)
    loadClientes()
  }

  async function deleteCliente(cliente: Cliente) {
    const [{ count: vehiculosCount }, { count: expedientesCount }, { count: facturasCount }] = await Promise.all([
      supabase.from('vehiculos').select('id', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
      supabase.from('expedientes').select('id', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
      supabase.from('facturas').select('id', { count: 'exact', head: true }).eq('cliente_id', cliente.id)
    ])

    const totalRelations = (vehiculosCount || 0) + (expedientesCount || 0) + (facturasCount || 0)
    if (totalRelations > 0) {
      toast.error('No se puede eliminar: tiene vehículos, expedientes o facturas asociados.')
      return
    }

    if (!confirm(`¿Eliminar definitivamente a ${cliente.nombre}?`)) return

    const { error } = await supabase.from('clientes').delete().eq('id', cliente.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Cliente eliminado')
      loadClientes()
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <Users size={14} /> Sprint 0.4A
          </div>
          <h2 className="text-3xl font-black tracking-tight">Clientes</h2>
          <p className="mt-1 text-zinc-500">Alta, búsqueda, ficha y edición de clientes reales desde Supabase.</p>
        </div>
        <button onClick={openCreate} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
        <div className="card flex items-center gap-3 p-4">
          <Search className="text-zinc-500" size={20} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono, email, NIF, población..."
            className="w-full border-0 bg-transparent p-0"
          />
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Clientes</p>
          <p className="mt-1 text-2xl font-black">{clientes.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resultados</p>
          <p className="mt-1 text-2xl font-black">{filtered.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h3 className="font-black">Listado de clientes</h3>
        </div>

        {loading ? (
          <div className="p-8 text-zinc-500">Cargando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-zinc-500">No hay clientes que coincidan con la búsqueda.</div>
        ) : (
          <div className="overflow-auto">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>NIF</th>
                  <th>Ubicación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cliente => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="font-black text-white">{cliente.nombre}</div>
                      <div className="mt-1 max-w-xs truncate text-sm text-zinc-500">{cliente.notas || 'Sin observaciones'}</div>
                    </td>
                    <td>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2"><Phone size={14} className="text-zinc-500" /> {cliente.telefono || '—'}</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-zinc-500" /> {cliente.email || '—'}</div>
                      </div>
                    </td>
                    <td>{cliente.nif || '—'}</td>
                    <td>{[cliente.poblacion, cliente.provincia].filter(Boolean).join(', ') || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/clientes/${cliente.id}`} className="btn btn-dark inline-flex items-center gap-2 text-sm"><Eye size={15} /> Ver</Link>
                        <button onClick={() => openEdit(cliente)} className="btn btn-dark inline-flex items-center gap-2 text-sm"><Edit3 size={15} /> Editar</button>
                        <button onClick={() => deleteCliente(cliente)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300"><Trash2 size={15} /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClienteModal
        open={modalOpen}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        initialData={editing || undefined}
        loading={saving}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={saveCliente}
      />
    </AppShell>
  )
}
