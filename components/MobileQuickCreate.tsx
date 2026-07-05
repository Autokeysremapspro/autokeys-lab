'use client'

import { useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Camera,
  Car,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Phone,
  Plus,
  User,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4

type Props = {
  onBack?: () => void
}

const trabajos = [
  'Duplicado llave',
  'Pérdida total de llaves',
  'Clonación ECU',
  'Reprogramación',
  'IMMO',
  'Cuadro instrumentos',
  'Airbag',
  'Diagnosis electrónica',
  'Otro',
]

export default function MobileQuickCreate({ onBack }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [createdOt, setCreatedOt] = useState<string | null>(null)
  const [createdExpedienteId, setCreatedExpedienteId] = useState<string | null>(null)

  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '' })
  const [vehiculo, setVehiculo] = useState({ marca: '', modelo: '', matricula: '', bastidor: '', motor: '' })
  const [trabajo, setTrabajo] = useState({
    tipo_trabajo: 'Clonación ECU',
    prioridad: 'normal',
    descripcion: '',
    tecnico: 'Carlos',
  })

  const progreso = useMemo(() => Math.round((step / 4) * 100), [step])

  function canNext() {
    if (step === 1) return cliente.nombre.trim() || cliente.telefono.trim()
    if (step === 2) return vehiculo.matricula.trim() || vehiculo.marca.trim()
    if (step === 3) return trabajo.tipo_trabajo.trim()
    return true
  }

  async function crearAltaRapida() {
    setSaving(true)
    setCreatedOt(null)
    setCreatedExpedienteId(null)

    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nombre: cliente.nombre.trim() || 'Cliente sin nombre',
          telefono: cliente.telefono.trim() || null,
          email: cliente.email.trim() || null,
        })
        .select('id')
        .single()

      if (clienteError) throw clienteError

      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from('vehiculos')
        .insert({
          cliente_id: clienteData.id,
          marca: vehiculo.marca.trim() || null,
          modelo: vehiculo.modelo.trim() || null,
          matricula: vehiculo.matricula.trim().toUpperCase() || null,
          bastidor: vehiculo.bastidor.trim().toUpperCase() || null,
          motor: vehiculo.motor.trim() || null,
        })
        .select('id')
        .single()

      if (vehiculoError) throw vehiculoError

      const { data: expedienteData, error: expedienteError } = await supabase
        .from('expedientes')
        .insert({
          cliente_id: clienteData.id,
          vehiculo_id: vehiculoData.id,
          tipo_trabajo: trabajo.tipo_trabajo,
          descripcion: trabajo.descripcion.trim() || `Alta rápida móvil: ${trabajo.tipo_trabajo}`,
          prioridad: trabajo.prioridad,
          tecnico: trabajo.tecnico || null,
          estado: 'recibido',
        })
        .select('id, numero_ot')
        .single()

      if (expedienteError) throw expedienteError

      setCreatedExpedienteId(expedienteData.id)
      setCreatedOt(expedienteData.numero_ot || expedienteData.id)
      toast.success('Alta rápida creada')
      setStep(4)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear el alta rápida')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setStep(1)
    setCreatedOt(null)
    setCreatedExpedienteId(null)
    setCliente({ nombre: '', telefono: '', email: '' })
    setVehiculo({ marca: '', modelo: '', matricula: '', bastidor: '', motor: '' })
    setTrabajo({ tipo_trabajo: 'Clonación ECU', prioridad: 'normal', descripcion: '', tecnico: 'Carlos' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="rounded-2xl border border-white/10 p-3 text-white">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Autokeys Core</div>
              <h1 className="text-xl font-black">Alta rápida móvil</h1>
            </div>
          </div>
          <div className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-black">{progreso}%</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-red-600 transition-all" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      <main className="mx-auto max-w-xl space-y-5 p-4 pb-28">
        {step === 1 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <MobileHeader icon={<User />} title="Cliente" subtitle="Datos mínimos para crear el expediente." />
            <MobileField label="Nombre" value={cliente.nombre} onChange={(v) => setCliente({ ...cliente, nombre: v })} placeholder="Nombre cliente o taller" />
            <MobileField label="Teléfono" value={cliente.telefono} onChange={(v) => setCliente({ ...cliente, telefono: v })} placeholder="Teléfono / WhatsApp" icon={<Phone size={18} />} inputMode="tel" />
            <MobileField label="Email" value={cliente.email} onChange={(v) => setCliente({ ...cliente, email: v })} placeholder="Email opcional" inputMode="email" />
          </section>
        )}

        {step === 2 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <MobileHeader icon={<Car />} title="Vehículo" subtitle="Rellena lo justo para darlo de alta rápido." />
            <MobileField label="Matrícula" value={vehiculo.matricula} onChange={(v) => setVehiculo({ ...vehiculo, matricula: v.toUpperCase() })} placeholder="1234ABC" />
            <div className="grid grid-cols-2 gap-3">
              <MobileField label="Marca" value={vehiculo.marca} onChange={(v) => setVehiculo({ ...vehiculo, marca: v })} placeholder="BMW" />
              <MobileField label="Modelo" value={vehiculo.modelo} onChange={(v) => setVehiculo({ ...vehiculo, modelo: v })} placeholder="320d" />
            </div>
            <MobileField label="Motor" value={vehiculo.motor} onChange={(v) => setVehiculo({ ...vehiculo, motor: v })} placeholder="N47 / 2.0 TDI / etc." />
            <MobileField label="VIN / Bastidor" value={vehiculo.bastidor} onChange={(v) => setVehiculo({ ...vehiculo, bastidor: v.toUpperCase() })} placeholder="Opcional" />
          </section>
        )}

        {step === 3 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <MobileHeader icon={<ClipboardList />} title="Servicio" subtitle="Crea la OT con el tipo de trabajo correcto." />
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Tipo de trabajo</span>
              <select value={trabajo.tipo_trabajo} onChange={(e) => setTrabajo({ ...trabajo, tipo_trabajo: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500">
                {trabajos.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Prioridad</span>
              <select value={trabajo.prioridad} onChange={(e) => setTrabajo({ ...trabajo, prioridad: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Notas rápidas</span>
              <textarea value={trabajo.descripcion} onChange={(e) => setTrabajo({ ...trabajo, descripcion: e.target.value })} placeholder="Síntoma, petición del cliente, observaciones..." className="h-32 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500" />
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
            <MobileHeader icon={<CheckCircle2 />} title="Alta creada" subtitle="Ya puedes continuar desde el PC o abrir el expediente." success />
            <div className="rounded-2xl bg-black/25 p-4 text-center">
              <div className="text-sm uppercase tracking-[0.2em] text-emerald-200/70">Orden de trabajo</div>
              <div className="mt-2 text-3xl font-black">{createdOt || 'Creada'}</div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3">
              {createdExpedienteId && <Link href={`/expedientes/${createdExpedienteId}`} className="rounded-2xl bg-red-600 px-5 py-4 text-center font-black text-white">Abrir expediente</Link>}
              <button onClick={reset} className="w-full rounded-2xl border border-white/10 px-5 py-4 font-black text-white">Crear otra alta</button>
            </div>
          </section>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          <div className="mb-2 flex items-center gap-2 font-bold text-white"><Camera size={18} /> Próximo paso</div>
          Añadiremos cámara directa para matrícula, vehículo, ECU, etiqueta y documentación.
        </div>
      </main>

      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-xl gap-3">
            <button disabled={step === 1 || saving} onClick={() => setStep((step - 1) as Step)} className="flex-1 rounded-2xl border border-white/10 px-5 py-4 font-black text-white disabled:opacity-40">Atrás</button>
            {step < 3 ? (
              <button disabled={!canNext()} onClick={() => setStep((step + 1) as Step)} className="flex-[2] rounded-2xl bg-red-600 px-5 py-4 font-black text-white disabled:opacity-40">Siguiente</button>
            ) : (
              <button disabled={!canNext() || saving} onClick={crearAltaRapida} className="flex-[2] rounded-2xl bg-red-600 px-5 py-4 font-black text-white disabled:opacity-40">
                {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Creando...</span> : <span className="inline-flex items-center gap-2"><Plus size={18} /> Crear OT</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MobileHeader({ icon, title, subtitle, success = false }: { icon: ReactNode; title: string; subtitle: string; success?: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={`rounded-2xl p-3 ${success ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-600/15 text-red-400'}`}>{icon}</div>
      <div><h2 className="text-2xl font-black">{title}</h2><p className="text-sm text-slate-400">{subtitle}</p></div>
    </div>
  )
}

function MobileField({ label, value, onChange, placeholder, icon, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; icon?: ReactNode; inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-red-500">
        {icon && <span className="text-slate-500">{icon}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="w-full border-0 bg-transparent p-0 text-white outline-none placeholder:text-slate-600" />
      </div>
    </label>
  )
}
