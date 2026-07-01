'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import VehiculoModal from '@/components/VehiculoModal'
import { VehiculoService } from '@/lib/services/vehiculos'
import type { Expediente, Factura, VehiculoConCliente } from '@/types/autokeys'
import { ArrowLeft, Cpu, FileText, Gauge, Pencil, ReceiptText, UserRound } from 'lucide-react'

export default function VehiculoFichaPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const [vehiculo, setVehiculo] = useState<VehiculoConCliente | null>(null)
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const v = await VehiculoService.getById(id)
      if (!v) {
        router.push('/vehiculos')
        return
      }
      setVehiculo(v)
      const related = await VehiculoService.getRelated(id)
      setExpedientes(related.expedientes as Expediente[])
      setFacturas((related.facturas as Factura[]).filter(f => expedientes.some(e => e.id === f.expediente_id)))
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la ficha')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <AppShell><div className="text-white">Cargando ficha...</div></AppShell>
  if (!vehiculo) return null

  return (
    <AppShell>
      <div className="space-y-8">
        <Link href="/vehiculos" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft size={16} /> Volver a vehículos</Link>
        {error && <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-4 font-bold text-red-200">{error}</div>}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.45em] text-red-400">Ficha vehículo</p>
              <h1 className="text-5xl font-black text-white">{vehiculo.marca || 'Vehículo'} {vehiculo.modelo || ''}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-slate-400">
                {vehiculo.matricula && <span className="font-black text-white">{vehiculo.matricula}</span>}
                {vehiculo.bastidor && <span>VIN: {vehiculo.bastidor}</span>}
                {vehiculo.motor && <span>Motor: {vehiculo.motor}</span>}
                {vehiculo.anio && <span>Año: {vehiculo.anio}</span>}
              </div>
              {vehiculo.cliente && <Link href={`/clientes/${vehiculo.cliente.id}`} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 font-bold text-white hover:bg-slate-800"><UserRound size={17} /> {vehiculo.cliente.nombre}</Link>}
            </div>
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-500"><Pencil size={18} /> Editar vehículo</button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <MiniStat icon={<Cpu />} label="ECU" value={vehiculo.ecu || 'Sin datos'} />
          <MiniStat icon={<FileText />} label="Expedientes" value={expedientes.length} />
          <MiniStat icon={<ReceiptText />} label="Facturas" value={facturas.length} />
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="mb-4 text-2xl font-black text-white">Datos técnicos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="ECU" value={vehiculo.ecu} />
            <Info label="Hardware" value={vehiculo.hardware} />
            <Info label="Software" value={vehiculo.software} />
          </div>
          {vehiculo.notas && <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-slate-300">{vehiculo.notas}</p>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="mb-4 text-2xl font-black text-white">Historial de expedientes</h2>
          <div className="grid gap-3">
            {expedientes.map(e => <Link key={e.id} href={`/expedientes/${e.id}`} className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 hover:border-red-500/50"><b className="text-white">{e.numero_ot || 'OT'}</b><p className="text-sm text-slate-400">{e.tipo_trabajo} · {e.estado}</p></Link>)}
            {expedientes.length === 0 && <p className="text-slate-400">Sin expedientes.</p>}
          </div>
        </section>
      </div>

      <VehiculoModal open={modalOpen} vehiculo={vehiculo} onClose={() => setModalOpen(false)} onSave={async payload => { await VehiculoService.update(id, payload); await load() }} />
    </AppShell>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-4 text-red-300">{icon}</div><p className="text-sm text-slate-400">{label}</p><b className="text-2xl text-white">{value}</b></div>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-black text-white">{value || 'Sin datos'}</p></div>
}
