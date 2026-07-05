'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import {
  AkCloudRecarga,
  aprobarRecargaAkCloud,
  getAkCloudRecargas,
  rechazarRecargaAkCloud,
} from '@/lib/services/akCloud'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react'

function estadoClass(estado?: string | null) {
  switch (estado) {
    case 'aprobado':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'rechazado':
      return 'border-red-500/30 bg-red-500/10 text-red-300'
    default:
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  }
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

export default function AkCloudRecargasPage() {
  const [recargas, setRecargas] = useState<AkCloudRecarga[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('pendiente')

  async function load() {
    setLoading(true)
    try {
      setRecargas(await getAkCloudRecargas())
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las recargas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recargas.filter((recarga) => {
      const matchesEstado = estado === 'todos' || (recarga.estado || 'pendiente') === estado
      const text = [
        recarga.nombre_cliente,
        recarga.email_cliente,
        recarga.metodo_pago,
        recarga.referencia_pago,
        recarga.notas_cliente,
        recarga.notas_admin,
      ].filter(Boolean).join(' ').toLowerCase()

      return matchesEstado && (!q || text.includes(q))
    })
  }, [recargas, query, estado])

  const pendientes = recargas.filter((r) => (r.estado || 'pendiente') === 'pendiente').length
  const aprobadas = recargas.filter((r) => r.estado === 'aprobado').length
  const creditosAprobados = recargas
    .filter((r) => r.estado === 'aprobado')
    .reduce((sum, r) => sum + Number(r.creditos || 0), 0)
  const importeAprobado = recargas
    .filter((r) => r.estado === 'aprobado')
    .reduce((sum, r) => sum + Number(r.importe || 0), 0)

  async function aprobar(recarga: AkCloudRecarga) {
    const notas = prompt('Notas internas para la aprobación (opcional):', recarga.notas_admin || '')
    setWorking(recarga.id)
    try {
      await aprobarRecargaAkCloud(recarga.id, notas)
      toast.success('Recarga aprobada y créditos sumados')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo aprobar la recarga')
    } finally {
      setWorking(null)
    }
  }

  async function rechazar(recarga: AkCloudRecarga) {
    const notas = prompt('Motivo / notas internas del rechazo:', recarga.notas_admin || '')
    if (notas === null) return
    setWorking(recarga.id)
    try {
      await rechazarRecargaAkCloud(recarga.id, notas)
      toast.success('Recarga rechazada')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo rechazar la recarga')
    } finally {
      setWorking(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#101827] to-[#19070d] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/ak-cloud" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
                <ArrowLeft size={16} /> Volver a AK Cloud
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Wallet size={16} /> AK Cloud Sync v3
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Recargas y créditos</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Aprueba solicitudes de recarga desde Autokeys Core. Al aprobar, se suman créditos al distribuidor y se notifica en AK Cloud.
              </p>
            </div>
            <button onClick={load} className="btn btn-dark inline-flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Pendientes</span><Clock3 size={20} /></div>
            <div className="mt-3 text-3xl font-black">{pendientes}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Aprobadas</span><CheckCircle2 size={20} /></div>
            <div className="mt-3 text-3xl font-black">{aprobadas}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Créditos</span><ShieldCheck size={20} /></div>
            <div className="mt-3 text-3xl font-black">{creditosAprobados}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Importe</span><CreditCard size={20} /></div>
            <div className="mt-3 text-3xl font-black">{formatMoney(importeAprobado)}</div>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <Search size={18} className="text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por distribuidor, email, referencia o notas..."
                className="w-full border-0 bg-transparent p-0 outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['todos', 'pendiente', 'aprobado', 'rechazado'].map((item) => (
                <button
                  key={item}
                  onClick={() => setEstado(item)}
                  className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-wider transition ${estado === item ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="card p-8 text-zinc-500">Cargando recargas...</div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-zinc-500">No hay recargas para este filtro.</div>
          ) : (
            filtered.map((recarga) => (
              <article key={recarga.id} className="card p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${estadoClass(recarga.estado)}`}>{recarga.estado || 'pendiente'}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-zinc-400">{formatDate(recarga.created_at)}</span>
                    </div>
                    <h3 className="text-2xl font-black">{recarga.nombre_cliente || recarga.email_cliente || 'Distribuidor AK Cloud'}</h3>
                    <p className="mt-1 text-zinc-500">{recarga.email_cliente || 'Sin email'} · {recarga.metodo_pago || 'Método no indicado'}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs font-black uppercase tracking-wider text-zinc-500">Créditos</p><p className="mt-1 text-2xl font-black text-white">{recarga.creditos || 0}</p></div>
                      <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs font-black uppercase tracking-wider text-zinc-500">Importe</p><p className="mt-1 text-2xl font-black text-white">{formatMoney(recarga.importe)}</p></div>
                      <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs font-black uppercase tracking-wider text-zinc-500">Referencia</p><p className="mt-1 truncate text-sm font-bold text-white">{recarga.referencia_pago || '—'}</p></div>
                    </div>
                    {(recarga.notas_cliente || recarga.notas_admin) && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                        {recarga.notas_cliente && <p><strong className="text-zinc-200">Cliente:</strong> {recarga.notas_cliente}</p>}
                        {recarga.notas_admin && <p className="mt-2"><strong className="text-zinc-200">Admin:</strong> {recarga.notas_admin}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col">
                    <button disabled={working === recarga.id || recarga.estado === 'aprobado'} onClick={() => aprobar(recarga)} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
                      <CheckCircle2 size={18} /> Aprobar
                    </button>
                    <button disabled={working === recarga.id || recarga.estado === 'rechazado'} onClick={() => rechazar(recarga)} className="btn btn-dark inline-flex items-center gap-2 text-red-300 disabled:opacity-50">
                      <XCircle size={18} /> Rechazar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  )
}
