'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import VehiculoModal from '@/components/VehiculoModal'
import { VehiculoService } from '@/lib/services/vehiculos'
import type { VehiculoConCliente } from '@/types/autokeys'
import { Plus, Search, Car, UserRound, Eye, Pencil } from 'lucide-react'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoConCliente[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VehiculoConCliente | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = query.trim() ? await VehiculoService.search(query) : await VehiculoService.getAll()
      setVehiculos(data)
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los vehículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [query])

  const total = useMemo(() => vehiculos.length, [vehiculos])

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.45em] text-red-400">Autokeys Core</p>
            <h1 className="text-5xl font-black text-white">Vehículos</h1>
            <p className="mt-2 text-slate-400">Matrículas, bastidores, ECUs e historial técnico.</p>
          </div>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500">
            <Plus size={19} /> Nuevo vehículo
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar matrícula, VIN, marca, modelo, motor o ECU..." className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none focus:border-red-500" />
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-sm font-bold text-slate-300">
              {loading ? 'Cargando...' : `${total} vehículos`}
            </div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 font-bold text-red-200">{error}</div>}

        <div className="grid gap-4">
          {vehiculos.map(vehiculo => (
            <div key={vehiculo.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10 transition hover:border-red-500/50">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
                    <Car size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{vehiculo.marca || 'Vehículo'} {vehiculo.modelo || ''}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                      {vehiculo.matricula && <span className="font-black text-white">{vehiculo.matricula}</span>}
                      {vehiculo.motor && <span>{vehiculo.motor}</span>}
                      {vehiculo.ecu && <span>ECU: {vehiculo.ecu}</span>}
                      {vehiculo.cliente && <span className="inline-flex items-center gap-1"><UserRound size={14} /> {vehiculo.cliente.nombre}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => { setEditing(vehiculo); setModalOpen(true) }} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 font-bold text-white hover:bg-slate-800"><Pencil size={16} /> Editar</button>
                  <Link href={`/vehiculos/${vehiculo.id}`} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-500"><Eye size={16} /> Abrir ficha</Link>
                </div>
              </div>
            </div>
          ))}

          {!loading && vehiculos.length === 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">No hay vehículos todavía.</div>
          )}
        </div>
      </div>

      <VehiculoModal
        open={modalOpen}
        vehiculo={editing}
        onClose={() => setModalOpen(false)}
        onSave={async payload => {
          if (editing) await VehiculoService.update(editing.id, payload)
          else await VehiculoService.create(payload)
          await load()
        }}
      />
    </AppShell>
  )
}
