'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import CustomSelect from '@/components/ak/CustomSelect'
import {
  AkCloudPedido,
  formatPedidoTitle,
  formatServicios,
  getAkCloudPedidos,
  getAkCloudStats,
  updateAkCloudPedido,
  type AkCloudStats,
} from '@/lib/services/akCloud'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gauge,
  Headphones,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

const estados = ['todos', 'pendiente', 'en_proceso', 'finalizado', 'cancelado']

const QUICK_LINKS = [
  { href: '/ak-cloud/solicitudes', label: 'Solicitudes', desc: 'Aprobar distribuidores', icon: ShieldCheck },
  { href: '/ak-cloud/produccion', label: 'Producción', desc: 'Pedidos en el laboratorio', icon: Gauge },
  { href: '/ak-cloud/soporte', label: 'Soporte', desc: 'Responder tickets', icon: Headphones },
  { href: '/ak-cloud/facturacion', label: 'Facturación', desc: 'Cobros AK Cloud', icon: CreditCard },
  { href: '/ak-cloud/admin', label: 'Catálogo y precios', desc: 'Categorías, precio por archivo, branding', icon: Settings },
]

export default function AkCloudPage() {
  const [pedidos, setPedidos] = useState<AkCloudPedido[]>([])
  const [stats, setStats] = useState<AkCloudStats | null>(null)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [pedidosData, statsData] = await Promise.all([
        getAkCloudPedidos(),
        getAkCloudStats(),
      ])
      setPedidos(pedidosData)
      setStats(statsData)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar AK Cloud')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pedidos.filter((pedido) => {
      const matchesEstado = estado === 'todos' || (pedido.estado || 'pendiente') === estado
      const haystack = [
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
      return matchesEstado && (!q || haystack.includes(q))
    })
  }, [pedidos, query, estado])

  async function quickUpdate(id: string, payload: Partial<AkCloudPedido>) {
    setWorking(id)
    try {
      await updateAkCloudPedido(id, payload)
      toast.success('Pedido actualizado')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar el pedido')
    } finally {
      setWorking(null)
    }
  }

  return (
    <LabShell
      title="AK Cloud"
      subtitle="Gestión interna de pedidos, pagos y sincronización con Autokeys Lab. Los distribuidores trabajan en AK Cloud; tú lo controlas desde aquí."
      actions={
        <>
          <a href="https://autokeys-file-service.vercel.app" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/[0.08]">
            Abrir AK Cloud <ExternalLink size={15} />
          </a>
          <button onClick={load} className="flex items-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e2242f]">
            <RefreshCw size={15} /> Actualizar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.012] p-4 transition hover:border-[#c81f2a]/35">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c81f2a]/10 text-[#ff5468]"><Icon size={19} /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{item.label}</div>
                  <div className="truncate text-[11px] text-zinc-500">{item.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <LabStatCard icon={<UploadCloud size={19} />} tone="red" label="Pedidos" value={stats?.total || 0} />
          <LabStatCard icon={<AlertTriangle size={19} />} tone="orange" label="Pendientes" value={stats?.pendientes || 0} />
          <LabStatCard icon={<Sparkles size={19} />} tone="blue" label="En proceso" value={stats?.enProceso || 0} />
          <LabStatCard icon={<CheckCircle2 size={19} />} tone="green" label="Finalizados" value={stats?.finalizados || 0} />
          <LabStatCard icon={<CreditCard size={19} />} tone="purple" label="Importe" value={`${Number(stats?.facturacion || 0).toFixed(0)} €`} />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_340px]">
          <LabPanel padded={false}>
            <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-white">Pedidos AK Cloud</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Pedidos recibidos desde el portal de distribuidores.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-[220px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <Search size={16} className="text-zinc-500" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por pedido, ECU, HW, cliente..." className="w-full border-0 bg-transparent p-0 text-sm outline-none" />
                </div>
                <CustomSelect
                  className="min-w-[150px]"
                  value={estado}
                  onChange={setEstado}
                  options={estados.map((item) => ({ value: item, label: item.replace('_', ' ') }))}
                />
              </div>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
              {loading ? (
                <div className="py-10 text-center text-sm text-zinc-500">Cargando pedidos...</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">No hay pedidos con esos filtros.</div>
              ) : (
                filtered.map((pedido) => (
                  <article key={pedido.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-[#c81f2a]/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#ff5468]">{pedido.numero || 'FS-SIN-NUM'}</span>
                          <LabBadge status={pedido.estado}>{(pedido.estado || 'pendiente').replace('_', ' ')}</LabBadge>
                          {pedido.prioridad === 'urgente' && <LabBadge tone="red">Urgente</LabBadge>}
                          {pedido.core_expediente_id && <LabBadge tone="green">Sincronizado</LabBadge>}
                        </div>
                        <h3 className="mt-1.5 truncate text-base font-bold text-white">{formatPedidoTitle(pedido)}</h3>
                        <p className="text-xs text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor sin identificar'}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold text-white">{Number(pedido.precio || 0).toFixed(2)} €</div>
                        <div className="text-[11px] text-zinc-600">{pedido.created_at ? new Date(pedido.created_at).toLocaleString('es-ES') : '—'}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Mini label="ECU" value={pedido.ecu || '—'} />
                      <Mini label="HW" value={pedido.hw || '—'} />
                      <Mini label="SW" value={pedido.sw || '—'} />
                      <Mini label="ORI" value={pedido.ori_nombre || '—'} />
                    </div>

                    <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Servicios</div>
                      <div className="mt-1 truncate text-sm font-bold text-[#ff5468]">{formatServicios(pedido.servicios)}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      {!pedido.core_expediente_id && (
                        <button disabled={working === pedido.id} onClick={() => quickUpdate(pedido.id, { prioridad: 'urgente' })} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50">
                          Marcar urgente
                        </button>
                      )}
                      {pedido.estado !== 'en_proceso' && pedido.estado !== 'finalizado' && (
                        <button disabled={working === pedido.id} onClick={() => quickUpdate(pedido.id, { estado: 'en_proceso' })} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50">
                          En proceso
                        </button>
                      )}
                      <Link href={`/ak-cloud/${pedido.id}`} className="flex items-center gap-1.5 rounded-xl bg-[#c81f2a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#e2242f]">
                        Abrir <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </LabPanel>

          <LabPanel title="Flujo recomendado">
            <p className="text-sm text-zinc-400">
              El distribuidor sube el ORI en AK Cloud. Tú revisas aquí, conviertes en expediente, trabajas en Lab y subes el MOD desde el pedido.
            </p>
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">{label}</div>
      <div className="mt-0.5 truncate text-xs font-bold text-zinc-200">{value}</div>
    </div>
  )
}
