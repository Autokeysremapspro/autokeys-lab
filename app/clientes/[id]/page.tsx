'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Car, ClipboardList, Edit3, FileText, Mail, MapPin, Phone, User } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ClienteModal from '@/components/ClienteModal'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  nif: string | null
  direccion: string | null
  codigo_postal: string | null
  poblacion: string | null
  provincia: string | null
  notas: string | null
  created_at: string
}

export default function ClienteDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [expedientes, setExpedientes] = useState<any[]>([])
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const [clienteRes, vehiculosRes, expedientesRes, facturasRes] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('vehiculos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('expedientes').select('*, vehiculos(marca, modelo, matricula)').eq('cliente_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('facturas').select('*').eq('cliente_id', id).order('created_at', { ascending: false }).limit(10)
    ])

    if (clienteRes.error) toast.error(clienteRes.error.message)
    setCliente((clienteRes.data || null) as Cliente | null)
    setVehiculos(vehiculosRes.data || [])
    setExpedientes(expedientesRes.data || [])
    setFacturas(facturasRes.data || [])
    setLoading(false)
  }

  async function saveCliente(payload: any) {
    setSaving(true)
    const { error } = await supabase.from('clientes').update({
      ...payload,
      nombre: payload.nombre.trim(),
      telefono: payload.telefono || null,
      email: payload.email || null,
      nif: payload.nif || null,
      direccion: payload.direccion || null,
      codigo_postal: payload.codigo_postal || null,
      poblacion: payload.poblacion || null,
      provincia: payload.provincia || null,
      notas: payload.notas || null
    }).eq('id', id)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cliente actualizado')
    setModalOpen(false)
    loadData()
  }

  if (loading) return <AppShell><div className="card p-8 text-zinc-500">Cargando ficha del cliente...</div></AppShell>
  if (!cliente) return <AppShell><div className="card p-8">Cliente no encontrado.</div></AppShell>

  const facturacionTotal = facturas.reduce((acc, factura) => acc + Number(factura.total || 0), 0)
  const direccionCompleta = [cliente.direccion, cliente.codigo_postal, cliente.poblacion, cliente.provincia].filter(Boolean).join(', ')

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <button onClick={() => router.push('/clientes')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
            <ArrowLeft size={16} /> Volver a clientes
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white">
              <User size={26} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{cliente.nombre}</h2>
              <p className="text-zinc-500">Ficha administrativa del cliente</p>
            </div>
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Edit3 size={18} /> Editar cliente
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Vehículos</p><p className="mt-2 text-3xl font-black">{vehiculos.length}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Expedientes</p><p className="mt-2 text-3xl font-black">{expedientes.length}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Facturas recientes</p><p className="mt-2 text-3xl font-black">{facturas.length}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Facturación</p><p className="mt-2 text-3xl font-black">{facturacionTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h3 className="mb-4 text-xl font-black">Contacto</h3>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-center gap-3"><Phone size={17} className="text-red-400" /> {cliente.telefono || 'Sin teléfono'}</div>
              <div className="flex items-center gap-3"><Mail size={17} className="text-red-400" /> {cliente.email || 'Sin email'}</div>
              <div className="flex items-center gap-3"><FileText size={17} className="text-red-400" /> {cliente.nif || 'Sin NIF/CIF'}</div>
              <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-red-400" /> <span>{direccionCompleta || 'Sin dirección'}</span></div>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="mb-3 text-xl font-black">Observaciones</h3>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-400">{cliente.notas || 'Sin observaciones internas.'}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h3 className="flex items-center gap-2 font-black"><Car size={18} /> Vehículos</h3>
              <Link href="/vehiculos" className="text-sm font-bold text-red-400 hover:text-red-300">Gestionar</Link>
            </div>
            {vehiculos.length === 0 ? <div className="p-6 text-zinc-500">Este cliente todavía no tiene vehículos.</div> : (
              <div className="divide-y divide-zinc-800">
                {vehiculos.map(v => (
                  <div key={v.id} className="p-5">
                    <div className="font-black">{[v.marca, v.modelo].filter(Boolean).join(' ') || 'Vehículo sin modelo'}</div>
                    <div className="mt-1 text-sm text-zinc-500">Matrícula: {v.matricula || '—'} · VIN: {v.bastidor || '—'} · Motor: {v.motor || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="flex items-center gap-2 font-black"><ClipboardList size={18} /> Últimos expedientes</h3>
            </div>
            {expedientes.length === 0 ? <div className="p-6 text-zinc-500">Todavía no hay expedientes para este cliente.</div> : (
              <div className="divide-y divide-zinc-800">
                {expedientes.map(ot => (
                  <Link key={ot.id} href={`/expedientes/${ot.id}`} className="block p-5 hover:bg-zinc-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-black">{ot.numero_ot || 'OT sin número'} · {ot.tipo_trabajo}</div>
                        <div className="mt-1 text-sm text-zinc-500">{ot.vehiculos?.marca || ''} {ot.vehiculos?.modelo || ''} {ot.vehiculos?.matricula ? `· ${ot.vehiculos.matricula}` : ''}</div>
                      </div>
                      <span className="badge bg-zinc-900 text-zinc-300">{ot.estado || 'recibido'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="flex items-center gap-2 font-black"><FileText size={18} /> Facturas recientes</h3>
            </div>
            {facturas.length === 0 ? <div className="p-6 text-zinc-500">Sin documentos de facturación.</div> : (
              <div className="divide-y divide-zinc-800">
                {facturas.map(f => (
                  <div key={f.id} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <div className="font-black">{f.numero_documento || f.numero_factura || 'Documento'}</div>
                      <div className="mt-1 text-sm text-zinc-500">{f.tipo_documento || 'factura'} · {f.estado || 'pendiente'}</div>
                    </div>
                    <div className="font-black">{Number(f.total || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ClienteModal
        open={modalOpen}
        title="Editar cliente"
        initialData={cliente}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={saveCliente}
      />
    </AppShell>
  )
}
