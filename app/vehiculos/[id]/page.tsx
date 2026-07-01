'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Calendar, Car, ClipboardList, Cpu, Edit3, FileText, Gauge, Hash, User } from 'lucide-react'
import AppShell from '@/components/AppShell'
import VehiculoModal from '@/components/VehiculoModal'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
}

type Vehiculo = {
  id: string
  cliente_id: string | null
  marca: string | null
  modelo: string | null
  motor: string | null
  anio: number | null
  matricula: string | null
  bastidor: string | null
  ecu: string | null
  hardware: string | null
  software: string | null
  notas: string | null
  created_at: string
  clientes?: Cliente | null
}

export default function VehiculoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [expedientes, setExpedientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const [vehiculoRes, clientesRes, expedientesRes] = await Promise.all([
      supabase.from('vehiculos').select('*, clientes(id,nombre,telefono)').eq('id', id).single(),
      supabase.from('clientes').select('id,nombre,telefono').order('nombre', { ascending: true }),
      supabase.from('expedientes').select('*, clientes(nombre,telefono)').eq('vehiculo_id', id).order('created_at', { ascending: false }).limit(20)
    ])

    if (vehiculoRes.error) toast.error(vehiculoRes.error.message)
    if (clientesRes.error) toast.error(clientesRes.error.message)

    setVehiculo((vehiculoRes.data || null) as Vehiculo | null)
    setClientes((clientesRes.data || []) as Cliente[])
    setExpedientes(expedientesRes.data || [])
    setLoading(false)
  }

  async function saveVehiculo(payload: any) {
    setSaving(true)
    const { error } = await supabase.from('vehiculos').update({
      cliente_id: payload.cliente_id || null,
      marca: payload.marca.trim() || null,
      modelo: payload.modelo.trim() || null,
      motor: payload.motor || null,
      anio: payload.anio ? Number(payload.anio) : null,
      matricula: payload.matricula || null,
      bastidor: payload.bastidor || null,
      ecu: payload.ecu || null,
      hardware: payload.hardware || null,
      software: payload.software || null,
      notas: payload.notas || null
    }).eq('id', id)

    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Vehículo actualizado')
    setModalOpen(false)
    loadData()
  }

  if (loading) return <AppShell><div className="card p-8 text-zinc-500">Cargando ficha del vehículo...</div></AppShell>
  if (!vehiculo) return <AppShell><div className="card p-8">Vehículo no encontrado.</div></AppShell>

  const title = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ') || 'Vehículo sin modelo'
  const fichaTecnica = [
    ['Matrícula', vehiculo.matricula || '—', Gauge],
    ['VIN / Bastidor', vehiculo.bastidor || '—', Hash],
    ['Motor', vehiculo.motor || '—', Cpu],
    ['Año', vehiculo.anio || '—', Calendar],
    ['ECU', vehiculo.ecu || '—', Cpu],
    ['Hardware', vehiculo.hardware || '—', FileText],
    ['Software', vehiculo.software || '—', FileText]
  ]

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <button onClick={() => router.push('/vehiculos')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
            <ArrowLeft size={16} /> Volver a vehículos
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Car size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{title}</h2>
              <p className="text-zinc-500">{vehiculo.matricula || 'Sin matrícula'} · {vehiculo.bastidor || 'Sin VIN'}</p>
            </div>
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Edit3 size={18} /> Editar vehículo
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Expedientes</p><p className="mt-2 text-3xl font-black">{expedientes.length}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">ECU</p><p className="mt-2 truncate text-2xl font-black">{vehiculo.ecu || '—'}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cliente</p><p className="mt-2 truncate text-2xl font-black">{vehiculo.clientes?.nombre || '—'}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h3 className="mb-4 text-xl font-black">Cliente asociado</h3>
            {vehiculo.clientes ? (
              <Link href={`/clientes/${vehiculo.clientes.id}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-red-500/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/15 text-red-400"><User size={22} /></div>
                  <div>
                    <div className="font-black text-white">{vehiculo.clientes.nombre}</div>
                    <div className="text-sm text-zinc-500">{vehiculo.clientes.telefono || 'Sin teléfono'}</div>
                  </div>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-500">Este vehículo todavía no tiene cliente asignado.</p>
            )}
          </section>

          <section className="card p-6">
            <h3 className="mb-3 text-xl font-black">Observaciones</h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-400">{vehiculo.notas || 'Sin observaciones internas.'}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h3 className="mb-5 text-xl font-black">Ficha técnica</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {fichaTecnica.map(([label, value, Icon]: any) => (
                <div key={label} className="rounded-2xl bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500"><Icon size={15} /> {label}</div>
                  <div className="mt-2 break-words font-bold text-zinc-200">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h3 className="flex items-center gap-2 font-black"><ClipboardList size={18} /> Historial de expedientes</h3>
              <Link href="/expedientes/nueva" className="text-sm font-bold text-red-400 hover:text-red-300">Nueva OT</Link>
            </div>
            {expedientes.length === 0 ? <div className="p-6 text-zinc-500">Todavía no hay expedientes para este vehículo.</div> : (
              <div className="divide-y divide-zinc-800">
                {expedientes.map(ot => (
                  <Link key={ot.id} href={`/expedientes/${ot.id}`} className="block p-5 hover:bg-zinc-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-black">{ot.numero_ot || 'OT sin número'} · {ot.tipo_trabajo}</div>
                        <div className="mt-1 text-sm text-zinc-500">Cliente: {ot.clientes?.nombre || vehiculo.clientes?.nombre || '—'} · {new Date(ot.created_at).toLocaleDateString('es-ES')}</div>
                      </div>
                      <span className="badge bg-zinc-900 text-zinc-300">{ot.estado || 'recibido'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <VehiculoModal
        open={modalOpen}
        title="Editar vehículo"
        clientes={clientes}
        initialData={vehiculo}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={saveVehiculo}
      />
    </AppShell>
  )
}
