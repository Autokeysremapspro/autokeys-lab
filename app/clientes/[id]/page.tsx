'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ClienteModal from '@/components/ClienteModal'
import { ClienteService } from '@/lib/services/clientes'
import type { Cliente, Expediente, Factura, Vehiculo } from '@/types/autokeys'
import { ArrowLeft, Car, FileText, Mail, Pencil, Phone, ReceiptText } from 'lucide-react'

export default function ClienteFichaPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const c = await ClienteService.getById(id)
      if (!c) {
        router.push('/clientes')
        return
      }
      setCliente(c)
      const related = await ClienteService.getRelated(id)
      setVehiculos(related.vehiculos as Vehiculo[])
      setExpedientes(related.expedientes as Expediente[])
      setFacturas(related.facturas as Factura[])
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la ficha')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <AppShell><div className="text-white">Cargando ficha...</div></AppShell>
  if (!cliente) return null

  const totalFacturado = facturas.reduce((acc, f) => acc + Number(f.total || 0), 0)

  return (
    <AppShell>
      <div className="space-y-8">
        <Link href="/clientes" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft size={16} /> Volver a clientes</Link>
        {error && <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 font-bold text-red-200">{error}</div>}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.45em] text-red-400">Ficha cliente</p>
              <h1 className="text-5xl font-black text-white">{cliente.nombre}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-slate-400">
                {cliente.telefono && <span className="inline-flex items-center gap-2"><Phone size={17} /> {cliente.telefono}</span>}
                {cliente.email && <span className="inline-flex items-center gap-2"><Mail size={17} /> {cliente.email}</span>}
                {cliente.nif && <span>NIF/CIF: {cliente.nif}</span>}
              </div>
              {(cliente.direccion || cliente.poblacion || cliente.provincia) && <p className="mt-3 text-slate-400">{cliente.direccion} {cliente.codigo_postal} {cliente.poblacion} {cliente.provincia}</p>}
            </div>
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-500"><Pencil size={18} /> Editar cliente</button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <MiniStat icon={<Car />} label="Vehículos" value={vehiculos.length} />
          <MiniStat icon={<FileText />} label="Expedientes" value={expedientes.length} />
          <MiniStat icon={<ReceiptText />} label="Facturación" value={`${totalFacturado.toFixed(2)} €`} />
        </div>

        <Section title="Vehículos">
          {vehiculos.map(v => <Link key={v.id} href={`/vehiculos/${v.id}`} className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-red-500/50"><b className="text-white">{v.marca || 'Vehículo'} {v.modelo || ''}</b><p className="text-sm text-slate-400">{v.matricula || 'Sin matrícula'} · {v.motor || 'Sin motor'} · {v.ecu || 'Sin ECU'}</p></Link>)}
          {vehiculos.length === 0 && <p className="text-slate-400">Sin vehículos asociados.</p>}
        </Section>

        <Section title="Expedientes">
          {expedientes.map(e => <Link key={e.id} href={`/expedientes/${e.id}`} className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-red-500/50"><b className="text-white">{e.numero_ot || 'OT'}</b><p className="text-sm text-slate-400">{e.tipo_trabajo} · {e.estado}</p></Link>)}
          {expedientes.length === 0 && <p className="text-slate-400">Sin expedientes.</p>}
        </Section>
      </div>

      <ClienteModal open={modalOpen} cliente={cliente} onClose={() => setModalOpen(false)} onSave={async payload => { await ClienteService.update(id, payload); await load() }} />
    </AppShell>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-4 text-red-300">{icon}</div><p className="text-sm text-slate-400">{label}</p><b className="text-3xl text-white">{value}</b></div>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"><h2 className="mb-4 text-2xl font-black text-white">{title}</h2><div className="grid gap-3">{children}</div></section>
}
