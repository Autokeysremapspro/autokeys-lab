'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import ClienteModal from '@/components/ClienteModal'
import { ClienteService } from '@/lib/services/clientes'
import type { ClienteResumen } from '@/types/autokeys'
import { Plus, Search, UserRound, Phone, Mail, Eye, Pencil } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClienteResumen | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = query.trim() ? await ClienteService.search(query) : await ClienteService.getAll()
      setClientes(data)
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [query])

  const total = useMemo(() => clientes.length, [clientes])

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.45em] text-red-400">Autokeys Core</p>
            <h1 className="text-5xl font-black text-white">Clientes</h1>
            <p className="mt-2 text-slate-400">Gestión administrativa de clientes y contactos.</p>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500">
            <Plus size={19} /> Nuevo cliente
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar nombre, teléfono, email o NIF..." className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none focus:border-red-500" />
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-sm font-bold text-slate-300">
              {loading ? 'Cargando...' : `${total} clientes`}
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 font-bold text-red-200">{error}</div>}

        <div className="grid gap-4">
          {clientes.map(cliente => (
            <div key={cliente.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 transition hover:border-red-500/50">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{cliente.nombre}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                      {cliente.telefono && <span className="inline-flex items-center gap-1"><Phone size={14} /> {cliente.telefono}</span>}
                      {cliente.email && <span className="inline-flex items-center gap-1"><Mail size={14} /> {cliente.email}</span>}
                      {cliente.nif && <span>NIF: {cliente.nif}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => { setEditing(cliente); setModalOpen(true) }} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-bold text-white hover:bg-slate-800"><Pencil size={16} /> Editar</button>
                  <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-500"><Eye size={16} /> Abrir ficha</Link>
                </div>
              </div>
            </div>
          ))}

          {!loading && clientes.length === 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">No hay clientes todavía.</div>
          )}
        </div>
      </div>

      <ClienteModal
        open={modalOpen}
        cliente={editing}
        onClose={() => setModalOpen(false)}
        onSave={async payload => {
          if (editing) await ClienteService.update(editing.id, payload)
          else await ClienteService.create(payload)
          await load()
        }}
      />
    </AppShell>
  )
}
