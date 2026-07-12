'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import {
  AkCloudPedido,
  AkCloudRecarga,
  akCloudEstadoClass,
  formatPedidoTitle,
  formatServicios,
  getAkCloudPedidos,
  getAkCloudRecargas,
  getAkCloudStats,
  updateAkCloudPedido,
  type AkCloudStats,
} from '@/lib/services/akCloud'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  CreditCard,
  DownloadCloud,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wallet,
} from 'lucide-react'

const estados = ['todos', 'pendiente', 'en_proceso', 'finalizado', 'cancelado']

export default function AkCloudPage() {
  const [pedidos, setPedidos] = useState<AkCloudPedido[]>([])
  const [recargas, setRecargas] = useState<AkCloudRecarga[]>([])
  const [stats, setStats] = useState<AkCloudStats | null>(null)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [pedidosData, recargasData, statsData] = await Promise.all([
        getAkCloudPedidos(),
        getAkCloudRecargas(),
        getAkCloudStats(),
      ])
      setPedidos(pedidosData)
      setRecargas(recargasData)
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

  const pendientesRecarga = recargas.filter((r) => (r.estado || 'pendiente') === 'pendiente').slice(0, 4)

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#111827] to-[#1b0b12] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[20%] h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Cloud size={16} /> AK Cloud Sync
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Centro AK Cloud</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Gestión interna de pedidos, créditos y sincronización con Autokeys Core. Los distribuidores trabajan en AK Cloud; tú lo controlas desde aquí.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="https://autokeys-file-service.vercel.app" target="_blank" className="btn btn-dark inline-flex items-center gap-2">
                Abrir AK Cloud <ExternalLink size={17} />
              </a>
              <button onClick={load} className="btn btn-red inline-flex items-center gap-2">
                <RefreshCw size={17} /> Actualizar
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link href="/ak-cloud/solicitudes" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <ShieldCheck className="text-red-400" size={22} />
            <div>
              <p className="font-black">Solicitudes</p>
              <p className="text-xs text-zinc-500">Aprobar distribuidores</p>
            </div>
          </Link>
          <Link href="/ak-cloud/produccion" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <UploadCloud className="text-red-400" size={22} />
            <div>
              <p className="font-black">Producción</p>
              <p className="text-xs text-zinc-500">Pedidos en el laboratorio</p>
            </div>
          </Link>
          <Link href="/ak-cloud/recargas" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <Wallet className="text-red-400" size={22} />
            <div>
              <p className="font-black">Recargas</p>
              <p className="text-xs text-zinc-500">Aprobar créditos</p>
            </div>
          </Link>
          <Link href="/ak-cloud/soporte" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <Sparkles className="text-red-400" size={22} />
            <div>
              <p className="font-black">Soporte</p>
              <p className="text-xs text-zinc-500">Responder tickets</p>
            </div>
          </Link>
          <Link href="/ak-cloud/facturacion" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <CreditCard className="text-red-400" size={22} />
            <div>
              <p className="font-black">Facturación</p>
              <p className="text-xs text-zinc-500">Cobros AK Cloud</p>
            </div>
          </Link>
          <Link href="/ak-cloud/admin" className="card flex items-center gap-3 p-4 transition hover:border-red-400/30">
            <Settings className="text-red-400" size={22} />
            <div>
              <p className="font-black">Planes y servicios</p>
              <p className="text-xs text-zinc-500">Precios, catálogo, branding</p>
            </div>
          </Link>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Stat title="Pedidos" value={stats?.total || 0} icon={UploadCloud} />
          <Stat title="Pendientes" value={stats?.pendientes || 0} icon={AlertTriangle} tone="amber" />
          <Stat title="En proceso" value={stats?.enProceso || 0} icon={Sparkles} tone="blue" />
          <Stat title="Finalizados" value={stats?.finalizados || 0} icon={CheckCircle2} tone="emerald" />
          <Stat title="Recargas" value={stats?.recargasPendientes || 0} icon={Wallet} tone="purple" />
          <Stat title="Importe" value={`${Number(stats?.facturacion || 0).toFixed(0)} €`} icon={CreditCard} />
        </div>

        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black">Pedidos AK Cloud</h2>
                <p className="mt-1 text-sm text-zinc-500">Pedidos recibidos desde el portal de distribuidores.</p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <Search size={17} className="text-zinc-500" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por pedido, ECU, HW, cliente..." className="w-full bg-transparent outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <Filter size={17} className="text-zinc-500" />
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="bg-transparent outline-none">
                    {estados.map((item) => <option key={item} value={item} className="bg-[#111827]">{item.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-zinc-500">Cargando pedidos...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-zinc-500">No hay pedidos con esos filtros.</div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((pedido) => (
                  <article key={pedido.id} className="group rounded-3xl border border-white/10 bg-[#111827] p-5 transition hover:border-red-500/35">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-black text-red-300">{pedido.numero || 'FS-SIN-NUM'}</span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${akCloudEstadoClass(pedido.estado)}`}>{(pedido.estado || 'pendiente').replace('_', ' ')}</span>
                          {pedido.prioridad === 'urgente' && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase text-red-300">Urgente</span>}
                          {pedido.core_expediente_id && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase text-emerald-300">Sincronizado</span>}
                        </div>
                        <h3 className="mt-2 text-2xl font-black">{formatPedidoTitle(pedido)}</h3>
                        <p className="mt-1 text-sm text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor sin identificar'}</p>
                      </div>
                      <div className="text-left xl:text-right">
                        <div className="text-2xl font-black">{Number(pedido.precio || 0).toFixed(2)} €</div>
                        <div className="text-xs text-zinc-500">{pedido.created_at ? new Date(pedido.created_at).toLocaleString('es-ES') : '—'}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <Mini label="ECU" value={pedido.ecu || '—'} />
                      <Mini label="HW" value={pedido.hw || '—'} />
                      <Mini label="SW" value={pedido.sw || '—'} />
                      <Mini label="ORI" value={pedido.ori_nombre || '—'} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Servicios</div>
                      <div className="mt-2 font-black text-red-200">{formatServicios(pedido.servicios)}</div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      {!pedido.core_expediente_id && (
                        <button disabled={working === pedido.id} onClick={() => quickUpdate(pedido.id, { prioridad: 'urgente' })} className="btn btn-dark text-sm disabled:opacity-50">
                          Marcar urgente
                        </button>
                      )}
                      {pedido.estado !== 'en_proceso' && pedido.estado !== 'finalizado' && (
                        <button disabled={working === pedido.id} onClick={() => quickUpdate(pedido.id, { estado: 'en_proceso' })} className="btn btn-dark text-sm disabled:opacity-50">
                          En proceso
                        </button>
                      )}
                      <Link href={`/ak-cloud/${pedido.id}`} className="btn btn-red inline-flex items-center gap-2 text-sm">
                        Abrir <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
              <h3 className="text-xl font-black">Recargas pendientes</h3>
              <p className="mt-1 text-sm text-zinc-500">Solicitudes de créditos desde AK Cloud.</p>
              <div className="mt-4 space-y-3">
                {pendientesRecarga.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">Sin recargas pendientes.</div>
                ) : pendientesRecarga.map((recarga) => (
                  <div key={recarga.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="font-black">{recarga.nombre_cliente || recarga.email_cliente || 'Distribuidor'}</div>
                    <div className="mt-1 text-sm text-zinc-500">{recarga.creditos || 0} créditos · {Number(recarga.importe || 0).toFixed(2)} €</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
              <DownloadCloud className="text-red-300" size={28} />
              <h3 className="mt-3 text-xl font-black">Flujo recomendado</h3>
              <p className="mt-2 text-sm text-zinc-400">
                El distribuidor sube el ORI en AK Cloud. Tú revisas aquí, conviertes en expediente, trabajas en Core y subes el MOD desde el pedido.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}

function Stat({ title, value, icon: Icon, tone = 'red' }: { title: string; value: any; icon: any; tone?: 'red' | 'amber' | 'blue' | 'emerald' | 'purple' }) {
  const tones: Record<string, string> = {
    red: 'text-red-300 bg-red-500/10 border-red-500/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
      <div className="flex items-center justify-between text-zinc-500">
        <span className="text-xs font-black uppercase tracking-[0.18em]">{title}</span>
        <div className={`rounded-2xl border p-2 ${tones[tone]}`}><Icon size={18} /></div>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-1 truncate font-bold">{value}</div>
    </div>
  )
}
