'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { crearAltaRapida } from '@/lib/services/altaRapida'
import { ArrowLeft, Camera, CheckCircle2, ClipboardList, Loader2, Plus, Smartphone } from 'lucide-react'

const servicios = [
  'Clonación ECU',
  'Reprogramación',
  'Duplicado llave',
  'Pérdida total de llaves',
  'IMMO',
  'Airbag',
  'Cuadro instrumentos',
  'BSI / BCM',
  'FEM / BDC',
  'Diagnosis avanzada',
  'Otro',
]

export default function AltaRapidaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    matricula: '',
    marca: '',
    modelo: '',
    motor: '',
    bastidor: '',
    tipo_trabajo: 'Clonación ECU',
    prioridad: 'normal',
    tecnico: '',
    descripcion: '',
  })

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const expediente = await crearAltaRapida(form)
      toast.success(`OT creada: ${expediente.numero_ot || 'sin número'}`)
      router.push(`/expedientes/${expediente.id}`)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear el alta rápida')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
              <Smartphone size={14} /> Modo móvil
            </div>
            <h2 className="text-3xl font-black tracking-tight">Alta rápida de vehículo</h2>
            <p className="mt-1 text-zinc-500">Para usar desde el móvil cuando entra un coche o estás en un taller.</p>
          </div>

          <Link href="/expedientes" className="btn btn-dark inline-flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Volver
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black">Datos mínimos</h3>
                <p className="text-sm text-zinc-500">Con esto se crea cliente, vehículo y expediente.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Cliente *</span>
                <input value={form.cliente_nombre} onChange={(e) => update('cliente_nombre', e.target.value)} placeholder="Nombre cliente / taller" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Teléfono</span>
                <input value={form.cliente_telefono} onChange={(e) => update('cliente_telefono', e.target.value)} placeholder="632982646" inputMode="tel" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Email</span>
                <input value={form.cliente_email} onChange={(e) => update('cliente_email', e.target.value)} placeholder="cliente@email.com" type="email" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Matrícula</span>
                <input value={form.matricula} onChange={(e) => update('matricula', e.target.value.toUpperCase())} placeholder="1234ABC" className="uppercase" />
              </label>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="mb-4 text-xl font-black">Vehículo</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.marca} onChange={(e) => update('marca', e.target.value)} placeholder="Marca" />
              <input value={form.modelo} onChange={(e) => update('modelo', e.target.value)} placeholder="Modelo" />
              <input value={form.motor} onChange={(e) => update('motor', e.target.value)} placeholder="Motor" />
              <input value={form.bastidor} onChange={(e) => update('bastidor', e.target.value.toUpperCase())} placeholder="VIN / Bastidor" className="uppercase" />
            </div>
          </section>

          <section className="card p-5">
            <h3 className="mb-4 text-xl font-black">Servicio</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Tipo de servicio *</span>
                <select value={form.tipo_trabajo} onChange={(e) => update('tipo_trabajo', e.target.value)} required>
                  {servicios.map((servicio) => <option key={servicio} value={servicio}>{servicio}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-zinc-300">Prioridad</span>
                <select value={form.prioridad} onChange={(e) => update('prioridad', e.target.value)}>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>
              <input value={form.tecnico} onChange={(e) => update('tecnico', e.target.value)} placeholder="Técnico asignado" />
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                <div className="mb-1 flex items-center gap-2 font-bold text-zinc-300"><Camera size={16} /> Fotos rápidas</div>
                En el siguiente sprint añadiremos captura directa de fotos desde el móvil.
              </div>
            </div>

            <textarea
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Notas rápidas: avería, lo que pide el taller, síntomas, urgencia..."
              className="mt-4 min-h-[120px]"
            />
          </section>

          <button disabled={saving} className="btn btn-red w-full justify-center gap-2 py-4 text-lg disabled:opacity-60">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Crear OT rápida
          </button>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
            <div className="mb-1 flex items-center gap-2 font-black"><CheckCircle2 size={18} /> Flujo recomendado</div>
            Usar esta pantalla desde el iPhone para dar de alta el coche en segundos y completar los datos técnicos después desde el PC del laboratorio.
          </div>
        </form>
      </div>
    </AppShell>
  )
}
