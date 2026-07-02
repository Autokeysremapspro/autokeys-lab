'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import ClienteTipoBadge from '@/components/ClienteTipoBadge'
import { getCrmClientes, searchCrmClientes, searchHistorialTecnico, updateClienteCrm } from '@/lib/services/crm'
import type { CrmClienteResumen, CrmVehiculoHistorial } from '@/types/crm'
import { Car, Euro, Loader2, Search, Star, UserRound, Wrench } from 'lucide-react'

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function fmt(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES').format(new Date(date))
}

export default function CrmPage() {
  const [clientes, setClientes] = useState<CrmClienteResumen[]>([])
  const [historial, setHistorial] = useState<CrmVehiculoHistorial[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CrmClienteResumen | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [c, h] = await Promise.all([getCrmClientes(), searchHistorialTecnico('')])
      setClientes(c)
      setHistorial(h)
      setSelected(c[0] || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function runSearch(value: string) {
    setQ(value)
    const [c, h] = await Promise.all([searchCrmClientes(value), searchHistorialTecnico(value)])
    setClientes(c)
    setHistorial(h)
    if (!selected && c[0]) setSelected(c[0])
  }

  async function setTipoCliente(tipo: string) {
    if (!selected) return
    setSaving(true)
    try {
      await updateClienteCrm(selected.id, { tipo_cliente: tipo })
      const updated = { ...selected, tipo_cliente: tipo }
      setSelected(updated)
      setClientes((rows) => rows.map((c) => c.id === updated.id ? updated : c))
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const totalFacturado = clientes.reduce((acc, c) => acc + Number(c.total_facturado || 0), 0)
    const pendiente = clientes.reduce((acc, c) => acc + Number(c.pendiente_cobro || 0), 0)
    const vehiculos = clientes.reduce((acc, c) => acc + Number(c.vehiculos_count || 0), 0)
    return { totalFacturado, pendiente, vehiculos }
  }, [clientes])

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-red-400 font-black uppercase tracking-[0.25em] text-xs">Autokeys Core CRM</p>
            <h1 className="text-4xl font-black mt-2">Clientes e historial técnico</h1>
            <p className="text-zinc-500 mt-2">Ficha comercial, historial de vehículos y trabajos por matrícula/VIN/ECU.</p>
          </div>
          <div className="relative w-full xl:w-[480px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              value={q}
              onChange={(e) => runSearch(e.target.value)}
              className="input w-full pl-12"
              placeholder="Buscar cliente, matrícula, VIN, ECU, OT..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5"><UserRound className="text-red-400" /><div className="text-3xl font-black mt-3">{clientes.length}</div><p className="text-zinc-500 text-sm">Clientes encontrados</p></div>
          <div className="card p-5"><Car className="text-red-400" /><div className="text-3xl font-black mt-3">{stats.vehiculos}</div><p className="text-zinc-500 text-sm">Vehículos asociados</p></div>
          <div className="card p-5"><Euro className="text-emerald-400" /><div className="text-3xl font-black mt-3">{money(stats.totalFacturado)}</div><p className="text-zinc-500 text-sm">Facturación clientes</p></div>
          <div className="card p-5"><Wrench className="text-yellow-400" /><div className="text-3xl font-black mt-3">{historial.length}</div><p className="text-zinc-500 text-sm">Trabajos en historial</p></div>
        </div>

        {loading ? (
          <div className="card p-8 text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando CRM...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-1 card p-4 space-y-3 max-h-[780px] overflow-auto">
              {clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setSelected(cliente)}
                  className={`w-full text-left rounded-3xl border p-4 transition ${selected?.id === cliente.id ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-lg">{cliente.nombre}</h3>
                      <p className="text-zinc-500 text-sm">{cliente.telefono || cliente.email || 'Sin contacto'}</p>
                    </div>
                    <ClienteTipoBadge tipo={cliente.tipo_cliente} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                    <div><span className="text-zinc-500 block">Vehículos</span><b>{cliente.vehiculos_count || 0}</b></div>
                    <div><span className="text-zinc-500 block">OT</span><b>{cliente.expedientes_count || 0}</b></div>
                    <div><span className="text-zinc-500 block">Facturado</span><b>{money(cliente.total_facturado)}</b></div>
                  </div>
                </button>
              ))}
            </section>

            <section className="xl:col-span-2 space-y-6">
              {selected && (
                <div className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3"><h2 className="text-3xl font-black">{selected.nombre}</h2><ClienteTipoBadge tipo={selected.tipo_cliente} /></div>
                      <p className="text-zinc-500 mt-2">{selected.telefono || 'Sin teléfono'} · {selected.email || 'Sin email'} · {selected.nif || 'Sin NIF'}</p>
                      <p className="text-zinc-500 text-sm mt-1">Última visita: {fmt(selected.ultima_visita)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['premium','normal','distribuidor','moroso','bloqueado'].map((tipo) => (
                        <button key={tipo} disabled={saving} onClick={() => setTipoCliente(tipo)} className="btn btn-dark text-xs">{tipo}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4"><span className="text-zinc-500 text-sm">Facturado</span><div className="font-black text-xl">{money(selected.total_facturado)}</div></div>
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4"><span className="text-zinc-500 text-sm">Pendiente</span><div className="font-black text-xl text-yellow-300">{money(selected.pendiente_cobro)}</div></div>
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4"><span className="text-zinc-500 text-sm">Vehículos</span><div className="font-black text-xl">{selected.vehiculos_count || 0}</div></div>
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4"><span className="text-zinc-500 text-sm">Expedientes</span><div className="font-black text-xl">{selected.expedientes_count || 0}</div></div>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5"><Star className="text-red-400" /><h2 className="text-2xl font-black">Historial técnico inteligente</h2></div>
                <div className="space-y-3 max-h-[520px] overflow-auto">
                  {historial.length === 0 ? <p className="text-zinc-500">Sin trabajos encontrados.</p> : historial.map((item, idx) => (
                    <div key={`${item.expediente_id || item.vehiculo_id}-${idx}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-black text-lg">{item.marca || 'Vehículo'} {item.modelo || ''}</h3>
                          <p className="text-zinc-500 text-sm">{item.matricula || 'Sin matrícula'} · {item.bastidor || 'Sin VIN'} · {item.ecu || 'Sin ECU'}</p>
                          <p className="mt-3"><span className="text-red-300 font-bold">{item.numero_ot || 'Sin OT'}</span> · {item.tipo_trabajo || 'Trabajo'} · {item.estado || '—'}</p>
                        </div>
                        <div className="text-right text-sm text-zinc-500">{fmt(item.created_at || item.fecha_entrada)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  )
}
