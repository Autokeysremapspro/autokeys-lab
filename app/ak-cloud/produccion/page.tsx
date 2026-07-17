'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import CustomSelect from '@/components/ak/CustomSelect'
import {
  AkCloudProduccionPedido,
  PRODUCCION_COLUMNAS,
  ProduccionEstado,
  actualizarEstadoProduccion,
  asignarTecnicoProduccion,
  estadoClass,
  estadoLabel,
  getPedidosProduccion,
  getProduccionStats,
  minutosDesde,
  normalizarEstado,
  serviciosTexto,
  tiempoHumano,
  tituloPedido,
} from '@/lib/services/akCloudProduccion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudCog,
  Factory,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  UserCog,
} from 'lucide-react'

const tecnicos = ['Carlos', 'Ana', 'Laboratorio', 'Administración']

export default function ProduccionAkCloudPage() {
  const [pedidos, setPedidos] = useState<AkCloudProduccionPedido[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [soloUrgentes, setSoloUrgentes] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setPedidos(await getPedidosProduccion())
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar producción')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pedidos.filter((pedido) => {
      const urgente = pedido.urgente || pedido.prioridad === 'urgente'
      if (soloUrgentes && !urgente) return false
      const texto = [
        pedido.numero,
        pedido.cliente_nombre,
        pedido.cliente_email,
        pedido.marca,
        pedido.modelo,
        pedido.motor,
        pedido.ecu,
        pedido.hw,
        pedido.sw,
        ...(pedido.servicios || []),
      ].filter(Boolean).join(' ').toLowerCase()
      return !q || texto.includes(q)
    })
  }, [pedidos, query, soloUrgentes])

  const stats = useMemo(() => getProduccionStats(pedidos), [pedidos])

  async function moverPedido(id: string, estado: ProduccionEstado) {
    setWorking(id)
    try {
      await actualizarEstadoProduccion(id, estado)
      toast.success(`Pedido movido a ${estadoLabel(estado)}`)
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo mover el pedido')
    } finally {
      setWorking(null)
    }
  }

  async function asignar(id: string, tecnico: string) {
    setWorking(id)
    try {
      await asignarTecnicoProduccion(id, tecnico)
      toast.success('Técnico asignado')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo asignar técnico')
    } finally {
      setWorking(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#080b10] via-[#101827] to-[#21040b] p-7 shadow-2xl shadow-black/40">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[20%] h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Factory size={16} /> Centro de producción
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">AK Cloud Producción</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Controla la cola de trabajos de File Service desde Autokeys Core. Cambia estados, asigna técnico y mantén informado al distribuidor sin WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ak-cloud" className="btn btn-dark inline-flex items-center gap-2">
                <CloudCog size={17} /> Centro AK Cloud
              </Link>
              <button onClick={load} className="btn btn-red inline-flex items-center gap-2">
                <RefreshCw size={17} /> Actualizar
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Stat title="Pedidos" value={stats.total} icon={Factory} />
          <Stat title="Nuevos" value={stats.nuevos} icon={AlertTriangle} tone="amber" />
          <Stat title="Analizando" value={stats.analizando} icon={Search} tone="cyan" />
          <Stat title="En proceso" value={stats.enProceso} icon={Sparkles} tone="blue" />
          <Stat title="Calidad" value={stats.calidad} icon={Timer} tone="purple" />
          <Stat title="Finalizados" value={stats.finalizados} icon={CheckCircle2} tone="emerald" />
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black">Cola de producción</h2>
              <p className="mt-1 text-sm text-zinc-500">Vista tipo Kanban para organizar trabajos y actualizar estados en AK Cloud.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Search size={17} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pedido, cliente, ECU, HW, SW..." className="w-full bg-transparent outline-none" />
              </div>
              <button onClick={() => setSoloUrgentes((v) => !v)} className={`btn ${soloUrgentes ? 'btn-red' : 'btn-dark'} inline-flex items-center gap-2`}>
                <Filter size={17} /> Urgentes
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-zinc-500">Cargando producción...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            {PRODUCCION_COLUMNAS.map((columna) => {
              const items = filtrados.filter((pedido) => normalizarEstado(pedido.estado) === columna.estado)
              return (
                <section key={columna.estado} className="min-h-[520px] rounded-[2rem] border border-white/10 bg-[#080d16] p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{columna.titulo}</h3>
                      <p className="mt-1 text-xs text-zinc-500">{columna.descripcion}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black">{items.length}</span>
                  </div>

                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-600">Sin pedidos</div>
                    ) : items.map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        working={working === pedido.id}
                        onMove={moverPedido}
                        onAssign={asignar}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function PedidoCard({
  pedido,
  working,
  onMove,
  onAssign,
}: {
  pedido: AkCloudProduccionPedido
  working: boolean
  onMove: (id: string, estado: ProduccionEstado) => void
  onAssign: (id: string, tecnico: string) => void
}) {
  const estado = normalizarEstado(pedido.estado)
  const minutos = minutosDesde(pedido.created_at)
  const urgente = pedido.urgente || pedido.prioridad === 'urgente'

  return (
    <article className="rounded-3xl border border-white/10 bg-[#111827] p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-red-500/35">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-black text-red-300">{pedido.numero || 'FS-SIN-NUM'}</div>
          <h4 className="mt-1 text-base font-black leading-tight">{tituloPedido(pedido)}</h4>
          <p className="mt-1 text-xs text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor'}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${estadoClass(estado)}`}>{estadoLabel(estado)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {urgente && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase text-red-300">Urgente</span>}
        {pedido.core_expediente_id && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-300">Expediente</span>}
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase text-zinc-400">{tiempoHumano(minutos)}</span>
      </div>

      <div className="mt-4 grid gap-2 text-xs">
        <Mini label="ECU" value={pedido.ecu || '—'} />
        <Mini label="HW" value={pedido.hw || '—'} />
        <Mini label="SW" value={pedido.sw || '—'} />
      </div>

      <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 p-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Servicios</div>
        <div className="mt-1 text-sm font-black text-red-200">{serviciosTexto(pedido.servicios)}</div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
        <UserCog size={15} className="text-zinc-500" />
        <CustomSelect
          className="flex-1"
          value={pedido.tecnico_asignado || ''}
          onChange={(v) => onAssign(pedido.id, v)}
          disabled={working}
          placeholder="Sin técnico"
          options={[{ value: '', label: 'Sin técnico' }, ...tecnicos.map((t) => ({ value: t, label: t }))]}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRODUCCION_COLUMNAS.filter((columna) => columna.estado !== estado).slice(0, 4).map((columna) => (
          <button
            key={columna.estado}
            onClick={() => onMove(pedido.id, columna.estado)}
            disabled={working}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-black uppercase text-zinc-300 hover:border-red-500/40 hover:text-white disabled:opacity-50"
          >
            {columna.titulo}
          </button>
        ))}
      </div>

      <Link href={`/ak-cloud/${pedido.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 hover:bg-red-500">
        Abrir pedido <ArrowRight size={15} />
      </Link>
    </article>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
      <span className="text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="truncate text-right font-bold text-zinc-200">{value}</span>
    </div>
  )
}

function Stat({ title, value, icon: Icon, tone = 'red' }: { title: string; value: any; icon: any; tone?: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-300 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  }
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-[#0B1220] p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{title}</div>
        <div className={`rounded-2xl border p-2 ${colors[tone] || colors.red}`}><Icon size={18} /></div>
      </div>
      <div className="mt-4 text-3xl font-black">{value}</div>
    </div>
  )
}
