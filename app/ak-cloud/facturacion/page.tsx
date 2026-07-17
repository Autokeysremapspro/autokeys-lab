'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import CustomSelect from '@/components/ak/CustomSelect'
import {
  AkCloudRecargaFactura,
  crearFacturaDesdeRecarga,
  getAkCloudRecargasFacturacion,
} from '@/lib/services/akCloudFacturacion'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function date(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function badge(estado?: string | null) {
  if (estado === 'aprobado') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (estado === 'rechazado') return 'border-red-500/30 bg-red-500/10 text-red-300'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
}

function openFactura(id: string, print = false) {
  const url = print ? `/api/documentos/${id}?print=1` : `/api/documentos/${id}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AkCloudFacturacionPage() {
  const [recargas, setRecargas] = useState<AkCloudRecargaFactura[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')

  async function load() {
    setLoading(true)
    try {
      setRecargas(await getAkCloudRecargasFacturacion())
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar la facturación AK Cloud')
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

  const totalAprobado = recargas
    .filter((r) => r.estado === 'aprobado')
    .reduce((sum, r) => sum + Number(r.importe || 0), 0)

  const pendientesFactura = recargas.filter((r) => r.estado === 'aprobado' && !r.core_factura_id).length
  const facturadas = recargas.filter((r) => !!r.core_factura_id).length

  async function crearFactura(recarga: AkCloudRecargaFactura) {
    if (recarga.estado !== 'aprobado') {
      toast.error('Solo se puede facturar una recarga aprobada')
      return
    }

    setWorking(recarga.id)
    try {
      const facturaId = await crearFacturaDesdeRecarga(recarga)
      toast.success('Factura creada en Autokeys Core')
      await load()
      openFactura(facturaId)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear la factura')
    } finally {
      setWorking(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#111827] to-[#1b0b12] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/ak-cloud" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
                <ArrowLeft size={16} /> Volver a AK Cloud
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <FileText size={16} /> AK Cloud Sync v4
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Facturación AK Cloud</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Genera facturas de recargas aprobadas usando el sistema de documentos de Autokeys Core. AK Cloud solo muestra el documento al distribuidor.
              </p>
            </div>
            <button onClick={load} className="btn btn-dark inline-flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Total aprobado</span><Wallet size={20} /></div>
            <div className="mt-3 text-3xl font-black">{money(totalAprobado)}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Pendientes factura</span><CreditCard size={20} /></div>
            <div className="mt-3 text-3xl font-black">{pendientesFactura}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400"><span className="text-xs font-black uppercase tracking-wider">Facturadas</span><CheckCircle2 size={20} /></div>
            <div className="mt-3 text-3xl font-black">{facturadas}</div>
          </div>
          <div className="card p-5 border border-red-500/20">
            <div className="text-xs font-black uppercase tracking-wider text-red-300">Flujo recomendado</div>
            <div className="mt-3 text-sm text-zinc-400">Recarga aprobada → factura Core → PDF visible en AK Cloud.</div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black">Recargas y facturas</h2>
              <p className="text-zinc-500">Control documental de créditos AK Cloud.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Search size={18} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar distribuidor, email o referencia..." className="w-full min-w-[280px] border-0 bg-transparent p-0" />
              </div>
              <CustomSelect
                className="min-w-[180px]"
                value={estado}
                onChange={setEstado}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'pendiente', label: 'Pendientes' },
                  { value: 'aprobado', label: 'Aprobadas' },
                  { value: 'rechazado', label: 'Rechazadas' },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-zinc-500">Cargando recargas...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-zinc-500">No hay recargas que coincidan.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-4">Distribuidor</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Créditos</th>
                    <th className="p-4">Importe</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Factura</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((recarga) => (
                    <tr key={recarga.id} className="hover:bg-white/[0.03]">
                      <td className="p-4">
                        <div className="font-black text-white">{recarga.nombre_cliente || 'Distribuidor'}</div>
                        <div className="text-sm text-zinc-500">{recarga.email_cliente || '—'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${badge(recarga.estado)}`}>
                          {recarga.estado || 'pendiente'}
                        </span>
                      </td>
                      <td className="p-4 font-black">{Number(recarga.creditos || 0)}</td>
                      <td className="p-4 font-black">{money(recarga.importe)}</td>
                      <td className="p-4 text-zinc-400">{date(recarga.created_at)}</td>
                      <td className="p-4">
                        {recarga.core_factura_id ? (
                          <span className="text-emerald-300 font-bold">Factura creada</span>
                        ) : recarga.estado === 'aprobado' ? (
                          <span className="text-amber-300 font-bold">Pendiente</span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {recarga.core_factura_id ? (
                            <>
                              <button onClick={() => openFactura(recarga.core_factura_id!)} className="btn btn-dark inline-flex items-center gap-2 text-sm">
                                <FileText size={15} /> Ver
                              </button>
                              <button onClick={() => openFactura(recarga.core_factura_id!, true)} className="btn btn-dark inline-flex items-center gap-2 text-sm">
                                <Printer size={15} /> Imprimir
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => crearFactura(recarga)}
                              disabled={working === recarga.id || recarga.estado !== 'aprobado'}
                              className="btn btn-red inline-flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                              {working === recarga.id ? <Loader2 className="animate-spin" size={15} /> : <FileText size={15} />}
                              Crear factura
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
