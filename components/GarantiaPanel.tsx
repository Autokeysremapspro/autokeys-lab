'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import {
  ExternalLink,
  FileSignature,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { GarantiaService, type GarantiaExpediente } from '@/lib/services/garantias'

type Props = {
  expedienteId: string
  clienteNombre?: string | null
  clienteNif?: string | null
  tipoTrabajo?: string | null
  descripcion?: string | null
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

type FormState = {
  titulo: string
  receptorNombre: string
  receptorDni: string
  trabajoRealizado: string
  condiciones: string
  observaciones: string
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function GarantiaPanel({
  expedienteId,
  clienteNombre,
  clienteNif,
  tipoTrabajo,
  descripcion,
  onEvent,
}: Props) {
  const [garantias, setGarantias] = useState<GarantiaExpediente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const initialForm = useMemo<FormState>(() => ({
    titulo: 'Garantía de servicio',
    receptorNombre: clienteNombre || '',
    receptorDni: clienteNif || '',
    trabajoRealizado: descripcion || tipoTrabajo || '',
    condiciones: '',
    observaciones: '',
  }), [clienteNombre, clienteNif, descripcion, tipoTrabajo])

  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  async function load() {
    setLoading(true)
    try {
      const data = await GarantiaService.getGarantiasExpediente(expedienteId)
      setGarantias(data)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las garantías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [expedienteId])

  async function crearGarantia() {
    if (!form.trabajoRealizado.trim()) {
      toast.error('Indica el trabajo realizado')
      return
    }

    setSaving(true)
    try {
      const garantia = await GarantiaService.crearGarantia({
        expedienteId,
        titulo: form.titulo,
        receptorNombre: form.receptorNombre,
        receptorDni: form.receptorDni,
        trabajoRealizado: form.trabajoRealizado,
        condiciones: form.condiciones,
        observaciones: form.observaciones,
        generadoPor: 'Autokeys Core ERP',
      })

      toast.success('Garantía generada')
      setGarantias((current) => [garantia, ...current])
      setShowForm(false)
      await onEvent?.('Garantía generada', form.trabajoRealizado)
      window.open(`/api/garantias/${garantia.id}`, '_blank')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo generar la garantía')
    } finally {
      setSaving(false)
    }
  }

  const [pendingDelete, setPendingDelete] = useState<GarantiaExpediente | null>(null)
  const [deletingGarantia, setDeletingGarantia] = useState(false)

  function eliminarGarantia(garantia: GarantiaExpediente) {
    setPendingDelete(garantia)
  }

  async function confirmEliminarGarantia() {
    if (!pendingDelete) return
    const garantia = pendingDelete
    setDeletingGarantia(true)
    try {
      await GarantiaService.eliminarGarantia(garantia.id)
      toast.success('Garantía eliminada')
      setGarantias((current) => current.filter((item) => item.id !== garantia.id))
      await onEvent?.('Garantía eliminada', garantia.titulo || 'Garantía eliminada desde ERP')
      setPendingDelete(null)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar la garantía')
    } finally {
      setDeletingGarantia(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#e2954d]/25 bg-[#e2954d]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb870]">
              <ShieldCheck size={14} /> Garantía ERP
            </div>
            <h3 className="text-2xl font-bold">Garantías y justificantes</h3>
            <p className="mt-1 text-zinc-500">
              Genera, imprime y guarda garantías directamente dentro de este expediente.
            </p>
          </div>

          <button
            onClick={() => setShowForm((value) => !value)}
            className="btn btn-red inline-flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {showForm ? 'Cerrar formulario' : 'Generar garantía'}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center gap-2 text-lg font-bold">
              <FileSignature className="text-[#ffb870]" /> Nueva garantía
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Título"
                value={form.titulo}
                onChange={(value) => setForm({ ...form, titulo: value })}
              />
              <Field
                label="Receptor / cliente"
                value={form.receptorNombre}
                onChange={(value) => setForm({ ...form, receptorNombre: value })}
              />
              <Field
                label="DNI / NIF"
                value={form.receptorDni}
                onChange={(value) => setForm({ ...form, receptorDni: value.toUpperCase() })}
              />
              <div />
              <Field
                label="Trabajo realizado"
                value={form.trabajoRealizado}
                textarea
                onChange={(value) => setForm({ ...form, trabajoRealizado: value })}
              />
              <Field
                label="Condiciones de garantía"
                value={form.condiciones}
                textarea
                placeholder="Si lo dejas vacío, se usará el texto de Configuración."
                onChange={(value) => setForm({ ...form, condiciones: value })}
              />
              <div className="md:col-span-2">
                <Field
                  label="Observaciones"
                  value={form.observaciones}
                  textarea
                  onChange={(value) => setForm({ ...form, observaciones: value })}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn btn-dark">
                Cancelar
              </button>
              <button
                onClick={crearGarantia}
                disabled={saving}
                className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <FileSignature size={18} />}
                Generar y abrir PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Garantías generadas</h3>
              <p className="text-sm text-zinc-500">Documentos vinculados a esta OT.</p>
            </div>
            <button onClick={load} className="btn btn-dark inline-flex items-center gap-2 text-sm">
              <RefreshCw size={15} /> Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-zinc-500">
            <Loader2 className="mr-2 inline animate-spin" size={18} /> Cargando garantías...
          </div>
        ) : garantias.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            Todavía no hay garantías generadas para este expediente.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {garantias.map((garantia) => (
              <div key={garantia.id} className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{garantia.titulo || 'Garantía de servicio'}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatDate(garantia.generado_at || garantia.created_at)} · {garantia.receptor_nombre || 'Sin receptor'}
                  </p>
                  {garantia.trabajo_realizado && (
                    <p className="mt-2 max-w-3xl text-sm text-zinc-400">{garantia.trabajo_realizado}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/garantias/${garantia.id}`}
                    target="_blank"
                    className="btn btn-dark inline-flex items-center gap-2 text-sm"
                  >
                    <ExternalLink size={15} /> Ver
                  </a>
                  <a
                    href={`/api/garantias/${garantia.id}?print=1`}
                    target="_blank"
                    className="btn btn-red inline-flex items-center gap-2 text-sm"
                  >
                    <Printer size={15} /> Imprimir
                  </a>
                  <button
                    onClick={() => eliminarGarantia(garantia)}
                    className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-400"
                  >
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Eliminar esta garantía"
        description="Se eliminará la garantía del expediente definitivamente."
        confirmLabel="Sí, eliminar"
        danger
        loading={deletingGarantia}
        onConfirm={confirmEliminarGarantia}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  textarea?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#e2954d]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#e2954d]"
        />
      )}
    </label>
  )
}
