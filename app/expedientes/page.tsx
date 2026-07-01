'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import ExpedienteStatusBadge from '@/components/ExpedienteStatusBadge'
import { ExpedienteService } from '@/lib/services/expedientes'
import type { ExpedienteConRelaciones } from '@/types/autokeys'
import { Car, ClipboardList, Cpu, Eye, KeyRound, Plus, Search, UserRound } from 'lucide-react'

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function formatVehicle(item: ExpedienteConRelaciones) {
  const v = item.vehiculo
  if (!v) return 'Sin vehículo'
  return [v.marca, v.modelo, v.matricula].filter(Boolean).join(' · ') || 'Vehículo sin datos'
}

function techIcon(tipo?: string | null) {
  const text = (tipo || '').toLowerCase()
  if (text.includes('llave') || text.includes('cas') || text.includes('fem') || text.includes('bdc')) return KeyRound
  return Cpu
}

export default function ExpedientesPage() {
  const [items, setItems] = useState<ExpedienteConRelaciones[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await ExpedienteService.getAll())
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los expedientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter((e) => {
      const haystack = `${e.numero_ot || ''} ${e.tipo_trabajo || ''} ${e.estado || ''} ${e.prioridad || ''} ${e.tecnico || ''} ${e.cliente?.nombre || ''} ${e.cliente?.telefono || ''} ${e.vehiculo?.marca || ''} ${e.vehiculo?.modelo || ''} ${e.vehiculo?.matricula || ''} ${e.vehiculo?.bastidor || ''} ${e.ecu?.modelo_ecu || ''} ${e.ecu?.hw || ''} ${e.ecu?.sw || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query])

  const openCount = items.filter(i => !['terminado', 'entregado', 'cancelado'].includes(i.estado || '')).length
  const urgentCount = items.filter(i => i.prioridad === 'urgente').length
  const ecuCount = items.filter(i => i.ecu).length
  const keyCount = items.filter(i => i.llaves).length

  return (
    <AppShell>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-7">
        <div>
          <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Autokeys Core</p>
          <h2 className="text-3xl font-black mt-1">Expedientes inteligentes</h2>
          <p className="text-zinc-500 mt-2">OT, ficha técnica, ECU, llaves e historial del laboratorio.</p>
        </div>
        <Link href="/expedientes/nueva" className="btn btn-red inline-flex items-center gap-2 justify-center">
          <Plus size={18} /> Nueva OT
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5"><p className="text-zinc-400 text-sm font-bold">OT abiertas</p><p className="text-3xl font-black mt-2">{openCount}</p></div>
        <div className="card p-5"><p className="text-zinc-400 text-sm font-bold">Urgentes</p><p className="text-3xl font-black mt-2">{urgentCount}</p></div>
        <div className="card p-5"><p className="text-zinc-400 text-sm font-bold">Fichas ECU</p><p className="text-3xl font-black mt-2">{ecuCount}</p></div>
        <div className="card p-5"><p className="text-zinc-400 text-sm font-bold">Fichas llaves</p><p className="text-3xl font-black mt-2">{keyCount}</p></div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3">
          <Search size={18} className="text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por OT, cliente, matrícula, VIN, ECU, HW, SW..."
            className="bg-transparent border-0 p-0 w-full"
          />
        </div>
      </div>

      {error && <div className="card p-4 border-red-500/30 text-red-300 mb-5">{error}</div>}
      {loading && <div className="card p-6 text-zinc-400">Cargando expedientes...</div>}

      {!loading && (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const Icon = techIcon(item.tipo_trabajo)
            return (
              <div key={item.id} className="card p-5 hover:border-red-500/30 transition">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-300">
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black">{item.numero_ot || 'OT sin número'}</h3>
                        <ExpedienteStatusBadge status={item.estado} />
                        {item.prioridad === 'urgente' && <span className="rounded-full border border-red-500/40 bg-red-500/15 text-red-300 px-3 py-1 text-xs font-black uppercase">Urgente</span>}
                      </div>
                      <p className="text-zinc-300 font-bold mt-1">{item.tipo_trabajo}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 mt-3">
                        <span className="inline-flex items-center gap-2"><UserRound size={16} /> {item.cliente?.nombre || 'Sin cliente'}</span>
                        <span className="inline-flex items-center gap-2"><Car size={16} /> {formatVehicle(item)}</span>
                        <span className="inline-flex items-center gap-2"><ClipboardList size={16} /> {item.tecnico || 'Sin técnico'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-zinc-500 font-bold uppercase">Importe</p>
                      <p className="text-lg font-black">{money(item.precio_final || item.precio_estimado)}</p>
                    </div>
                    <Link href={`/expedientes/${item.id}`} className="btn btn-dark inline-flex items-center gap-2">
                      <Eye size={17} /> Abrir ficha
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length && <div className="card p-8 text-center text-zinc-500">No hay expedientes con ese filtro.</div>}
        </div>
      )}
    </AppShell>
  )
}
