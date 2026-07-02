'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { FolderTree, User, Car, ClipboardList, FileText, Search, ChevronRight } from 'lucide-react'

type ClienteNode = any

type DataState = {
  clientes: any[]
  vehiculos: any[]
  expedientes: any[]
  facturas: any[]
}

export default function ExploradorPage() {
  const [data, setData] = useState<DataState>({ clientes: [], vehiculos: [], expedientes: [], facturas: [] })
  const [selectedCliente, setSelectedCliente] = useState<string>('')
  const [selectedVehiculo, setSelectedVehiculo] = useState<string>('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [clientes, vehiculos, expedientes, facturas] = await Promise.all([
          supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(250),
          supabase.from('vehiculos').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('expedientes').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('facturas').select('*').order('created_at', { ascending: false }).limit(500),
        ])
        setData({
          clientes: clientes.data || [],
          vehiculos: vehiculos.data || [],
          expedientes: expedientes.data || [],
          facturas: facturas.data || [],
        })
      } catch (err) {
        console.error('Explorer error', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const clientesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.clientes
    return data.clientes.filter((c: any) => [c.nombre, c.telefono, c.email, c.nif].filter(Boolean).some((v: string) => v.toLowerCase().includes(q)))
  }, [data.clientes, query])

  const vehiculosCliente = useMemo(() => data.vehiculos.filter((v: any) => v.cliente_id === selectedCliente), [data.vehiculos, selectedCliente])
  const expedientesVehiculo = useMemo(() => data.expedientes.filter((e: any) => e.vehiculo_id === selectedVehiculo), [data.expedientes, selectedVehiculo])
  const selectedClienteObj = data.clientes.find((c: any) => c.id === selectedCliente)
  const selectedVehiculoObj = data.vehiculos.find((v: any) => v.id === selectedVehiculo)

  function pickCliente(id: string) {
    setSelectedCliente(id)
    const firstVehicle = data.vehiculos.find((v: any) => v.cliente_id === id)
    setSelectedVehiculo(firstVehicle?.id || '')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-red-400 font-black uppercase tracking-[0.18em] text-xs"><FolderTree size={16} /> Explorador de expedientes</div>
              <h2 className="text-3xl font-black mt-2">Clientes → Vehículos → OT → Facturas</h2>
              <p className="text-zinc-500 mt-2">Navega por el historial del laboratorio sin saltar entre veinte pantallas.</p>
            </div>
            <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 lg:w-[420px]">
              <Search size={18} className="text-zinc-500" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente, teléfono, email o NIF..." className="bg-transparent border-0 p-0 outline-none w-full text-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 card p-4 min-h-[520px]">
            <div className="flex items-center gap-2 mb-4 font-black"><User size={18} /> Clientes</div>
            <div className="space-y-2 max-h-[680px] overflow-auto pr-1">
              {loading && <p className="text-zinc-500 text-sm p-4">Cargando...</p>}
              {clientesFiltrados.map((c: any) => (
                <button key={c.id} onClick={() => pickCliente(c.id)} className={`w-full text-left p-3 rounded-2xl transition border ${selectedCliente === c.id ? 'bg-red-600 border-red-500' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'}`}>
                  <div className="font-bold truncate">{c.nombre}</div>
                  <div className="text-xs text-zinc-400 truncate mt-1">{[c.telefono, c.email].filter(Boolean).join(' · ') || 'Sin contacto'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="xl:col-span-3 card p-4 min-h-[520px]">
            <div className="flex items-center gap-2 mb-4 font-black"><Car size={18} /> Vehículos</div>
            {!selectedCliente && <p className="text-zinc-500 text-sm p-4">Selecciona un cliente.</p>}
            <div className="space-y-2 max-h-[680px] overflow-auto pr-1">
              {vehiculosCliente.map((v: any) => (
                <button key={v.id} onClick={() => setSelectedVehiculo(v.id)} className={`w-full text-left p-3 rounded-2xl transition border ${selectedVehiculo === v.id ? 'bg-red-600 border-red-500' : 'bg-white/[0.03] border-white/5 hover:bg-white/5'}`}>
                  <div className="font-bold truncate">{[v.marca, v.modelo].filter(Boolean).join(' ') || 'Vehículo'}</div>
                  <div className="text-xs text-zinc-400 truncate mt-1">{[v.matricula, v.bastidor, v.ecu].filter(Boolean).join(' · ') || 'Sin datos técnicos'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="xl:col-span-6 space-y-6">
            <div className="card p-5">
              <div className="text-xs text-zinc-500 font-black uppercase tracking-[0.18em]">Selección actual</div>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                <span className="px-3 py-2 rounded-xl bg-white/5">{selectedClienteObj?.nombre || 'Cliente no seleccionado'}</span>
                <ChevronRight size={16} className="text-zinc-600" />
                <span className="px-3 py-2 rounded-xl bg-white/5">{selectedVehiculoObj ? [selectedVehiculoObj.marca, selectedVehiculoObj.modelo, selectedVehiculoObj.matricula].filter(Boolean).join(' · ') : 'Vehículo no seleccionado'}</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-black"><ClipboardList size={18} /> Expedientes</div>
                {selectedVehiculo && <Link href="/expedientes/nueva" className="btn btn-red text-sm">Nueva OT</Link>}
              </div>
              {!selectedVehiculo && <p className="text-zinc-500 text-sm p-4">Selecciona un vehículo.</p>}
              <div className="space-y-3">
                {expedientesVehiculo.map((e: any) => (
                  <Link key={e.id} href={`/expedientes/${e.id}`} className="block p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black">{e.numero_ot || 'OT sin número'}</div>
                        <div className="text-sm text-zinc-500 mt-1">{[e.tipo_trabajo, e.tecnico].filter(Boolean).join(' · ')}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">{e.estado || 'sin estado'}</span>
                    </div>
                  </Link>
                ))}
                {selectedVehiculo && expedientesVehiculo.length === 0 && <p className="text-zinc-500 text-sm p-4">Este vehículo aún no tiene expedientes.</p>}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 font-black mb-4"><FileText size={18} /> Documentos del cliente</div>
              <div className="grid md:grid-cols-2 gap-3">
                {data.facturas.filter((f: any) => f.cliente_id === selectedCliente).slice(0, 8).map((f: any) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="font-bold">{f.numero_documento || f.tipo_documento || 'Documento'}</div>
                    <div className="text-xs text-zinc-500 mt-1">{[f.tipo_documento, f.estado].filter(Boolean).join(' · ')} · {Number(f.total || 0).toFixed(2)} €</div>
                  </div>
                ))}
                {selectedCliente && data.facturas.filter((f: any) => f.cliente_id === selectedCliente).length === 0 && <p className="text-zinc-500 text-sm p-4">Sin documentos asociados.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
