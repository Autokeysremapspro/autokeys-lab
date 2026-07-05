'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardSignature,
  Loader2,
  Search,
  Send,
  UserRound,
} from 'lucide-react'
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad'
import { EntregaService, type ExpedienteEntregaResumen } from '@/lib/services/entregas'

type FormState = {
  receptorNombre: string
  receptorDni: string
  observaciones: string
}

function expedienteTitle(item: ExpedienteEntregaResumen) {
  return item.numero_ot || item.id.slice(0, 8)
}

function vehiculoText(item: ExpedienteEntregaResumen) {
  const v = item.vehiculos
  return [v?.marca, v?.modelo, v?.matricula].filter(Boolean).join(' · ') || 'Sin vehículo'
}

export default function MobileEntregaPage() {
  const signatureRef = useRef<SignaturePadHandle | null>(null)
  const [query, setQuery] = useState('')
  const [expedientes, setExpedientes] = useState<ExpedienteEntregaResumen[]>([])
  const [selected, setSelected] = useState<ExpedienteEntregaResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState<FormState>({
    receptorNombre: '',
    receptorDni: '',
    observaciones: '',
  })

  async function load(term = '') {
    setLoading(true)
    try {
      const data = await EntregaService.buscarExpedientes(term)
      setExpedientes(data)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las OT')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const pendientes = useMemo(
    () => expedientes.filter((item) => item.estado !== 'entregado' && item.estado !== 'cancelado'),
    [expedientes]
  )

  async function submit() {
    if (!selected) {
      toast.error('Selecciona una OT')
      return
    }

    if (!form.receptorNombre.trim()) {
      toast.error('Introduce el nombre del receptor')
      return
    }

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Falta la firma del cliente')
      return
    }

    setSaving(true)
    try {
      const firmaBlob = await signatureRef.current.toBlob()

      await EntregaService.crearEntrega({
        expedienteId: selected.id,
        receptorNombre: form.receptorNombre,
        receptorDni: form.receptorDni,
        observaciones: form.observaciones,
        firmaBlob,
        entregadoPor: 'Autokeys Core Mobile',
      })

      toast.success('Entrega registrada')
      setDone(true)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar la entrega')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setSelected(null)
    setDone(false)
    setForm({ receptorNombre: '', receptorDni: '', observaciones: '' })
    signatureRef.current?.clear()
    load()
  }

  if (done && selected) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 text-white">
        <div className="mx-auto max-w-xl space-y-5 pt-6">
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 size={34} />
            </div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-200/70">Entrega registrada</div>
            <h1 className="mt-2 text-3xl font-black">{expedienteTitle(selected)}</h1>
            <p className="mt-2 text-emerald-100/80">El expediente se marcó como entregado y la firma quedó guardada.</p>
          </div>

          <button onClick={reset} className="w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white">
            Registrar otra entrega
          </button>

          <Link href="/mobile" className="block w-full rounded-2xl border border-white/10 px-5 py-4 text-center font-black text-white">
            Volver a móvil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Autokeys Core</div>
            <h1 className="text-xl font-black">Entrega con firma</h1>
          </div>
          <Link href="/mobile" className="rounded-2xl border border-white/10 p-3 text-white">
            <ArrowLeft size={20} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-5 p-4 pb-24">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-red-600/15 p-3 text-red-400"><Search /></div>
            <div>
              <h2 className="text-2xl font-black">Seleccionar OT</h2>
              <p className="text-sm text-slate-400">Busca por número de OT, estado o tipo de trabajo.</p>
            </div>
          </div>

          <div className="flex gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-red-500">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') load(query)
              }}
              placeholder="Buscar OT..."
              className="w-full bg-transparent text-white outline-none"
            />
            <button onClick={() => load(query)} className="font-black text-red-400">Buscar</button>
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="rounded-2xl bg-black/20 p-4 text-slate-400">Cargando expedientes...</div>
            ) : pendientes.length === 0 ? (
              <div className="rounded-2xl bg-black/20 p-4 text-slate-400">No hay OT pendientes.</div>
            ) : (
              pendientes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-red-400">{expedienteTitle(item)}</div>
                      <div className="mt-1 text-lg font-black">{item.tipo_trabajo || 'Servicio sin definir'}</div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{item.estado || 'sin estado'}</span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><UserRound size={15} /> {item.clientes?.nombre || 'Sin cliente'}</div>
                    <div className="flex items-center gap-2"><Car size={15} /> {vehiculoText(item)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {selected && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-red-600/15 p-3 text-red-400"><ClipboardSignature /></div>
              <div>
                <h2 className="text-2xl font-black">Datos de entrega</h2>
                <p className="text-sm text-slate-400">Firma del cliente y entrega del vehículo.</p>
              </div>
            </div>

            <MobileField label="Nombre receptor" value={form.receptorNombre} onChange={(value) => setForm({ ...form, receptorNombre: value })} placeholder="Nombre completo" />
            <MobileField label="DNI / NIF" value={form.receptorDni} onChange={(value) => setForm({ ...form, receptorDni: value.toUpperCase() })} placeholder="Opcional" />

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Observaciones</span>
              <textarea
                value={form.observaciones}
                onChange={(event) => setForm({ ...form, observaciones: event.target.value })}
                placeholder="Estado de entrega, material entregado, aviso al cliente..."
                className="h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500"
              />
            </label>

            <div className="mb-4">
              <span className="mb-2 block text-sm font-bold text-slate-300">Firma cliente</span>
              <SignaturePad ref={signatureRef} />
            </div>

            <button
              onClick={submit}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-black text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {saving ? 'Registrando entrega...' : 'Entregar vehículo'}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

function MobileField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500"
      />
    </label>
  )
}
