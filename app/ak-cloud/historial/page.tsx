'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Car, MessageSquare, RefreshCw, Search, Wrench } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Pedido = {
  id: string
  numero?: string | null
  user_id?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  anio?: string | null
  ecu?: string | null
  hw?: string | null
  sw?: string | null
  servicios?: string[] | null
  estado?: string | null
  core_vehiculo_id?: string | null
  created_at?: string | null
}

type Mensaje = {
  id: string
  pedido_id: string
  autor_nombre?: string | null
  mensaje?: string | null
  created_at?: string | null
}

type Grupo = {
  key: string
  pedidos: Pedido[]
  ultimo: Pedido
  ultimoMensaje?: Mensaje
}

function normal(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function vehicleKey(pedido: Pedido) {
  if (pedido.core_vehiculo_id) return `core:${pedido.core_vehiculo_id}`
  return ['veh', pedido.user_id, normal(pedido.marca), normal(pedido.modelo), normal(pedido.motor), normal(pedido.ecu), normal(pedido.hw), normal(pedido.sw)].join('|')
}

function title(pedido: Pedido) {
  return [pedido.marca, pedido.modelo, pedido.motor].filter(Boolean).join(' · ') || 'Vehículo sin identificar'
}

export default function AkCloudHistorialPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [{ data: pedidosData, error: pedidosError }, { data: mensajesData, error: mensajesError }] = await Promise.all([
        supabase.from('file_service_pedidos').select('id,numero,user_id,cliente_nombre,cliente_email,marca,modelo,motor,anio,ecu,hw,sw,servicios,estado,core_vehiculo_id,created_at').order('created_at', { ascending: false }),
        supabase.from('file_service_mensajes').select('id,pedido_id,autor_nombre,mensaje,created_at').order('created_at', { ascending: false }),
      ])
      if (pedidosError) throw pedidosError
      if (mensajesError) throw mensajesError
      setPedidos((pedidosData || []) as Pedido[])
      setMensajes((mensajesData || []) as Mensaje[])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el historial de AK Cloud')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const groups = useMemo(() => {
    const latestMessage = new Map<string, Mensaje>()
    for (const mensaje of mensajes) if (!latestMessage.has(mensaje.pedido_id)) latestMessage.set(mensaje.pedido_id, mensaje)

    const map = new Map<string, Pedido[]>()
    for (const pedido of pedidos) {
      const key = vehicleKey(pedido)
      const current = map.get(key) || []
      current.push(pedido)
      map.set(key, current)
    }

    return Array.from(map.entries()).map(([key, items]): Grupo => ({
      key,
      pedidos: items,
      ultimo: items[0],
      ultimoMensaje: latestMessage.get(items[0].id),
    }))
  }, [pedidos, mensajes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(({ pedidos: items }) => items.some((pedido) => [
      pedido.numero, pedido.cliente_nombre, pedido.cliente_email, pedido.marca, pedido.modelo,
      pedido.motor, pedido.anio, pedido.ecu, pedido.hw, pedido.sw, ...(pedido.servicios || []),
    ].filter(Boolean).join(' ').toLowerCase().includes(q)))
  }, [groups, query])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link href="/ak-cloud" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Volver a AK Cloud</Link>
            <div className="flex items-center gap-3"><Car className="text-[#ff5468]"/><h1 className="text-4xl font-bold">Historial de vehículos y trabajos</h1></div>
            <p className="mt-2 text-zinc-500">Agrupa los pedidos por vehículo y mantiene acceso directo al pedido y a su conversación técnica.</p>
          </div>
          <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCw size={17}/> Actualizar</button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={17} className="text-zinc-500"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, vehículo, ECU, HW, SW, servicio o pedido..." className="w-full bg-transparent outline-none"/>
          </div>

          {loading ? <div className="p-10 text-center text-zinc-500">Cargando historial...</div> : filtered.length === 0 ? <div className="p-10 text-center text-zinc-500">No hay historial con esos filtros.</div> : (
            <div className="grid gap-5">
              {filtered.map((grupo) => {
                const p = grupo.ultimo
                const services = Array.from(new Set(grupo.pedidos.flatMap((item) => item.servicios || [])))
                return (
                  <article key={grupo.key} className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#ff5468]">{p.numero || 'FS-SIN-NUM'}</span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase text-zinc-300">{grupo.pedidos.length} trabajo{grupo.pedidos.length === 1 ? '' : 's'}</span>
                          {p.core_vehiculo_id && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase text-emerald-300">Vehículo Core vinculado</span>}
                        </div>
                        <h2 className="mt-2 text-2xl font-bold">{title(p)}</h2>
                        <p className="mt-1 text-sm text-zinc-500">{p.cliente_nombre || p.cliente_email || 'Distribuidor sin identificar'} · {p.ecu || 'ECU —'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/ak-cloud/${p.id}`} className="btn btn-dark inline-flex items-center gap-2"><Wrench size={16}/> Abrir último trabajo</Link>
                        <Link href={`/ak-cloud/${p.id}`} className="btn btn-red inline-flex items-center gap-2"><MessageSquare size={16}/> Abrir chat</Link>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <Mini label="Año" value={p.anio || '—'}/>
                      <Mini label="HW" value={p.hw || '—'}/>
                      <Mini label="SW" value={p.sw || '—'}/>
                      <Mini label="Último estado" value={(p.estado || 'pendiente').replace('_', ' ')}/>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Servicios realizados</div>
                      <div className="mt-2 text-sm font-bold text-[#ff5468]">{services.length ? services.join(' · ') : 'Sin servicios registrados'}</div>
                    </div>

                    {grupo.ultimoMensaje && (
                      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-300">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Último mensaje asociado</div>
                        <span className="font-bold text-white">{grupo.ultimoMensaje.autor_nombre || 'Chat'}:</span> {grupo.ultimoMensaje.mensaje || '—'}
                      </div>
                    )}

                    {grupo.pedidos.length > 1 && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                        {grupo.pedidos.slice(0, 8).map((pedido) => (
                          <Link key={pedido.id} href={`/ak-cloud/${pedido.id}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-[#ff5468]/30 hover:text-white">
                            {pedido.numero || 'Pedido'} · {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('es-ES') : 'sin fecha'}
                          </Link>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div><div className="mt-1 truncate font-bold capitalize">{value}</div></div>
}
