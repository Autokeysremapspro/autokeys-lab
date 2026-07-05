'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BadgeCheck,
  Car,
  ExternalLink,
  FileSignature,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { GarantiaService, type GarantiaExpediente, type GarantiaExpedienteResumen } from '@/lib/services/garantias'

type FormState = {
  titulo: string
  receptorNombre: string
  receptorDni: string
  trabajoRealizado: string
  condiciones: string
  observaciones: string
}

function expedienteTitle(item: GarantiaExpedienteResumen) {
  return item.numero_ot || item.id.slice(0, 8)
}

function vehiculoText(item: GarantiaExpedienteResumen) {
  const v = item.vehiculos
  return [v?.marca, v?.modelo, v?.matricula].filter(Boolean).join(' · ') || 'Sin vehículo'
}

export default function MobileGarantiaPage() {
  const [query, setQuery] = useState('')
  const [expedientes, setExpedientes] = useState<GarantiaExpedienteResumen[]>([])
  const [selected, setSelected] = useState<GarantiaExpedienteResumen | null>(null)
  const [garantias, setGarantias] = useState<GarantiaExpediente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    titulo: 'Garantía de servicio',
    receptorNombre: '',
    receptorDni: '',
    trabajoRealizado: '',
    condiciones: '',
    observaciones: '',
  })

  async function load(term = query) {
    setLoading(true)
    try {
      const data = await GarantiaService.buscarExpedientes(term)
      setExpedientes(data)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar expedientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => load(query), 350)
    return () => window.clearTimeout(timeout)
  }, [query])

  async function selectExpediente(item: GarantiaExpedienteResumen) {
    setSelected(item)
    setForm((current) => ({
      ...current,
      receptorNombre: item.clientes?.nombre || current.receptorNombre,
      receptorDni: item.clientes?.nif || current.receptorDni,
      trabajoRealizado: item.descripcion || item.tipo_trabajo || current.trabajoRealizado,
    }))

    try {
      const data = await GarantiaService.getGarantiasExpediente(item.id)
      setGarantias(data)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar garantías')
    }
  }

  const filtered = useMemo(() => expedientes, [expedientes])

  async function submit() {
    if (!selected) {
      toast.error('Selecciona una OT')
      return
    }

    if (!form.trabajoRealizado.trim()) {
      toast.error('Indica el trabajo realizado')
      return
    }

    setSaving(true)
    try {
      const garantia = await GarantiaService.crearGarantia({
        expedienteId: selected.id,
        titulo: form.titulo,
        receptorNombre: form.receptorNombre,
        receptorDni: form.receptorDni,
        trabajoRealizado: form.trabajoRealizado,
        condiciones: form.condiciones,
        observaciones: form.observaciones,
        generadoPor: 'Autokeys Core Mobile',
      })

      toast.success('Garantía generada')
      setGarantias((current) => [garantia, ...current])
      window.open(`/api/garantias/${garantia.id}`, '_blank')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo generar la garantía')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080b12] px-4 py-5 text-white">
      <div className="mx-auto max-w-md space-y-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/mobile" className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Autokeys Core</div>
            <h1 className="text-2xl font-black">Garantía</h1>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <ShieldCheck size={20} />
          </div>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30">
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-400">
            <Search size={16} /> Buscar OT
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="OT, trabajo, matrícula..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-base font-bold outline-none placeholder:text-zinc-600 focus:border-red-500"
          />
        </section>

        <section className="space-y-3">
          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 text-zinc-400">
              <Loader2 className="mr-2 inline animate-spin" size={18} /> Cargando expedientes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-6 text-center text-zinc-500">
              No hay expedientes que coincidan.
            </div>
          ) : (
            filtered.slice(0, 8).map((item) => {
              const active = selected?.id === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => selectExpediente(item)}
                  className={`w-full rounded-[2rem] border p-4 text-left transition ${active ? 'border-red-500 bg-red-500/15' : 'border-white/10 bg-white/[0.04]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-red-300">{expedienteTitle(item)}</div>
                      <div className="mt-1 text-lg font-black">{vehiculoText(item)}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                        <UserRound size={14} /> {item.clientes?.nombre || 'Sin cliente'}
                      </div>
                    </div>
                    <Car className="text-zinc-500" size={22} />
                  </div>
                </button>
              )
            })
          )}
        </section>

        {selected && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-red-400">
              <FileSignature size={16} /> Generar documento
            </div>

            <div className="space-y-3">
              <input
                value={form.titulo}
                onChange={(event) => setForm({ ...form, titulo: event.target.value })}
                placeholder="Título"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
              <input
                value={form.receptorNombre}
                onChange={(event) => setForm({ ...form, receptorNombre: event.target.value })}
                placeholder="Nombre receptor / cliente"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
              <input
                value={form.receptorDni}
                onChange={(event) => setForm({ ...form, receptorDni: event.target.value.toUpperCase() })}
                placeholder="DNI / NIF"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
              <textarea
                value={form.trabajoRealizado}
                onChange={(event) => setForm({ ...form, trabajoRealizado: event.target.value })}
                placeholder="Trabajo realizado"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
              <textarea
                value={form.condiciones}
                onChange={(event) => setForm({ ...form, condiciones: event.target.value })}
                placeholder="Condiciones especiales de garantía (opcional)"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
              <textarea
                value={form.observaciones}
                onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                placeholder="Observaciones de entrega"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500"
              />
            </div>

            <button
              onClick={submit}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-950/40 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <BadgeCheck size={18} />}
              Generar garantía
            </button>
          </section>
        )}

        {selected && garantias.length > 0 && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
            <h2 className="mb-3 text-lg font-black">Garantías generadas</h2>
            <div className="space-y-2">
              {garantias.map((garantia) => (
                <div key={garantia.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="font-black">{garantia.titulo || 'Garantía'}</div>
                  <div className="text-xs text-zinc-500">{garantia.generado_at ? new Date(garantia.generado_at).toLocaleString('es-ES') : '—'}</div>
                  <div className="mt-3 flex gap-2">
                    <a href={`/api/garantias/${garantia.id}`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">
                      <ExternalLink size={15} /> Ver
                    </a>
                    <a href={`/api/garantias/${garantia.id}?print=1`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-black">
                      <Printer size={15} /> Imprimir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
