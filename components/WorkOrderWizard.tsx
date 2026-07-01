'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  ClipboardList,
  Cpu,
  KeyRound,
  Search,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react'

type Cliente = {
  id: string
  nombre: string
  telefono?: string | null
  email?: string | null
  nif?: string | null
}

type Vehiculo = {
  id: string
  cliente_id?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  matricula?: string | null
  bastidor?: string | null
  ecu?: string | null
}

type WorkType = {
  id: string
  label: string
  description: string
  icon: any
  color: string
  technical: 'ecu' | 'llaves' | 'immo' | 'general'
}

const workTypes: WorkType[] = [
  { id: 'clonacion_ecu', label: 'Clonación ECU', description: 'Flash, EEPROM, backup, donante y original', icon: Cpu, color: 'red', technical: 'ecu' },
  { id: 'reprogramacion', label: 'Reprogramación', description: 'Stage, DPF, EGR, SCR, hardcut o pops', icon: Wrench, color: 'amber', technical: 'ecu' },
  { id: 'llaves', label: 'Llaves', description: 'Duplicado, pérdida total o programación', icon: KeyRound, color: 'green', technical: 'llaves' },
  { id: 'immo', label: 'IMMO', description: 'IMMO OFF, virginización o adaptación', icon: ShieldCheck, color: 'blue', technical: 'immo' },
  { id: 'fem_cas_bdc', label: 'FEM / CAS / BDC', description: 'BMW llaves, ISN, coding y backup', icon: Cpu, color: 'red', technical: 'llaves' },
  { id: 'cuadro', label: 'Cuadro', description: 'Reparación, km, eeprom o clonación', icon: ClipboardList, color: 'zinc', technical: 'general' },
  { id: 'airbag', label: 'Airbag', description: 'Crash data, reparación o sustitución', icon: ShieldCheck, color: 'amber', technical: 'general' },
  { id: 'otro', label: 'Otro trabajo', description: 'Trabajo personalizado de laboratorio', icon: ClipboardList, color: 'zinc', technical: 'general' },
]

const prioridades = ['normal', 'baja', 'alta', 'urgente']

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ')
}

function normalize(text: string) {
  return text.toLowerCase().trim()
}

export default function WorkOrderWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clienteQuery, setClienteQuery] = useState('')
  const [vehiculoQuery, setVehiculoQuery] = useState('')

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null)
  const [selectedWork, setSelectedWork] = useState<WorkType>(workTypes[0])

  const [newCliente, setNewCliente] = useState({ nombre: '', telefono: '', email: '', nif: '', direccion: '', poblacion: '', provincia: '' })
  const [newVehiculo, setNewVehiculo] = useState({ marca: '', modelo: '', motor: '', matricula: '', bastidor: '', anio: '', ecu: '' })
  const [ot, setOt] = useState({ prioridad: 'normal', tecnico: 'Carlos', precio_estimado: '', descripcion: '', notas_internas: '' })

  useEffect(() => { loadClientes() }, [])
  useEffect(() => { loadVehiculos() }, [selectedCliente])

  async function loadClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,nombre,telefono,email,nif')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) toast.error(error.message)
    setClientes(data || [])
  }

  async function loadVehiculos() {
    if (!selectedCliente) {
      setVehiculos([])
      setSelectedVehiculo(null)
      return
    }
    const { data, error } = await supabase
      .from('vehiculos')
      .select('id,cliente_id,marca,modelo,motor,matricula,bastidor,ecu')
      .eq('cliente_id', selectedCliente.id)
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setVehiculos(data || [])
  }

  const filteredClientes = useMemo(() => {
    const q = normalize(clienteQuery)
    if (!q) return clientes.slice(0, 8)
    return clientes.filter((c) => normalize(`${c.nombre || ''} ${c.telefono || ''} ${c.email || ''} ${c.nif || ''}`).includes(q)).slice(0, 10)
  }, [clientes, clienteQuery])

  const filteredVehiculos = useMemo(() => {
    const q = normalize(vehiculoQuery)
    if (!q) return vehiculos.slice(0, 8)
    return vehiculos.filter((v) => normalize(`${v.marca || ''} ${v.modelo || ''} ${v.motor || ''} ${v.matricula || ''} ${v.bastidor || ''} ${v.ecu || ''}`).includes(q)).slice(0, 10)
  }, [vehiculos, vehiculoQuery])

  async function createCliente() {
    if (!newCliente.nombre.trim()) return toast.error('El nombre del cliente es obligatorio')
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre: newCliente.nombre.trim(),
        telefono: newCliente.telefono || null,
        email: newCliente.email || null,
        nif: newCliente.nif || null,
        direccion: newCliente.direccion || null,
        poblacion: newCliente.poblacion || null,
        provincia: newCliente.provincia || null,
      })
      .select('id,nombre,telefono,email,nif')
      .single()
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Cliente creado')
    setClientes((prev) => [data, ...prev])
    setSelectedCliente(data)
    setStep(2)
  }

  async function createVehiculo() {
    if (!selectedCliente) return toast.error('Selecciona primero un cliente')
    if (!newVehiculo.marca.trim() && !newVehiculo.matricula.trim()) return toast.error('Introduce al menos marca o matrícula')
    setLoading(true)
    const { data, error } = await supabase
      .from('vehiculos')
      .insert({
        cliente_id: selectedCliente.id,
        marca: newVehiculo.marca || null,
        modelo: newVehiculo.modelo || null,
        motor: newVehiculo.motor || null,
        matricula: newVehiculo.matricula ? newVehiculo.matricula.toUpperCase() : null,
        bastidor: newVehiculo.bastidor ? newVehiculo.bastidor.toUpperCase() : null,
        anio: newVehiculo.anio ? Number(newVehiculo.anio) : null,
        ecu: newVehiculo.ecu || null,
      })
      .select('id,cliente_id,marca,modelo,motor,matricula,bastidor,ecu')
      .single()
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Vehículo creado')
    setVehiculos((prev) => [data, ...prev])
    setSelectedVehiculo(data)
    setStep(3)
  }

  async function createOT() {
    if (!selectedCliente) return toast.error('Falta seleccionar cliente')
    if (!selectedVehiculo) return toast.error('Falta seleccionar vehículo')
    if (!selectedWork) return toast.error('Falta seleccionar trabajo')

    setLoading(true)

    const payload = {
      cliente_id: selectedCliente.id,
      vehiculo_id: selectedVehiculo.id,
      tipo_trabajo: selectedWork.label,
      descripcion: ot.descripcion || selectedWork.description,
      estado: 'recibido',
      prioridad: ot.prioridad,
      tecnico: ot.tecnico || null,
      precio_estimado: ot.precio_estimado ? Number(ot.precio_estimado) : 0,
      notas_internas: ot.notas_internas || null,
    }

    const { data: expediente, error } = await supabase
      .from('expedientes')
      .insert(payload)
      .select('id,numero_ot')
      .single()

    if (error) {
      setLoading(false)
      return toast.error(error.message)
    }

    const technicalInserts: Promise<any>[] = []

    if (selectedWork.technical === 'ecu' || selectedWork.technical === 'immo') {
      technicalInserts.push(
        supabase.from('expediente_ecu').insert({
          expediente_id: expediente.id,
          marca_ecu: selectedVehiculo.ecu ? null : null,
          modelo_ecu: selectedVehiculo.ecu || null,
          estado_immo: selectedWork.technical === 'immo' ? 'pendiente' : null,
          stage: selectedWork.id === 'reprogramacion' ? 'pendiente' : null,
          checksum: 'pendiente',
          herramienta: null,
          notas: `Ficha creada desde asistente para ${selectedWork.label}`,
        }) as any
      )
    }

    if (selectedWork.technical === 'llaves') {
      technicalInserts.push(
        supabase.from('expediente_llaves').insert({
          expediente_id: expediente.id,
          llaves_originales: 0,
          llaves_programadas: 0,
          plataforma: selectedWork.id === 'fem_cas_bdc' ? 'BMW FEM/CAS/BDC' : null,
          estado: 'pendiente',
          notas: `Ficha creada desde asistente para ${selectedWork.label}`,
        }) as any
      )
    }

    technicalInserts.push(
      supabase.from('expediente_historial').insert({
        expediente_id: expediente.id,
        evento: 'OT creada',
        descripcion: `Creada desde asistente: ${selectedWork.label}`,
        usuario: ot.tecnico || 'Autokeys Lab',
      }) as any
    )

    const results = await Promise.allSettled(technicalInserts)
    const failed = results.find((r) => r.status === 'fulfilled' && (r as any).value?.error)
    setLoading(false)

    if (failed) toast.error('OT creada, pero hubo un aviso creando la ficha técnica')
    else toast.success(`${expediente.numero_ot || 'OT'} creada`)

    router.push(`/expedientes/${expediente.id}`)
  }

  function next() {
    if (step === 1 && !selectedCliente) return toast.error('Selecciona o crea un cliente')
    if (step === 2 && !selectedVehiculo) return toast.error('Selecciona o crea un vehículo')
    setStep((s) => Math.min(4, s + 1))
  }

  function back() {
    setStep((s) => Math.max(1, s - 1))
  }

  return (
    <div className="grid xl:grid-cols-[1fr_360px] gap-6">
      <div className="card p-5 lg:p-7">
        <Stepper step={step} />

        {step === 1 && (
          <section className="mt-7">
            <SectionTitle icon={<User size={22} />} title="Paso 1 · Cliente" subtitle="Busca un cliente existente o crea uno nuevo en segundos." />
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div>
                <SearchBox value={clienteQuery} onChange={setClienteQuery} placeholder="Buscar por nombre, teléfono, email o NIF..." />
                <div className="space-y-3 mt-4">
                  {filteredClientes.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCliente(c)} className={cx('selection-card w-full text-left', selectedCliente?.id === c.id && 'selection-card-active')}>
                      <p className="font-black">{c.nombre}</p>
                      <p className="text-sm text-zinc-500">{c.telefono || c.email || c.nif || 'Sin datos de contacto'}</p>
                    </button>
                  ))}
                  {filteredClientes.length === 0 && <Empty text="No hay clientes con esa búsqueda." />}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="font-black text-lg mb-4">Crear cliente rápido</h3>
                <div className="grid gap-3">
                  <input placeholder="Nombre / Razón social" value={newCliente.nombre} onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })} />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Teléfono" value={newCliente.telefono} onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })} />
                    <input placeholder="NIF/CIF" value={newCliente.nif} onChange={(e) => setNewCliente({ ...newCliente, nif: e.target.value })} />
                  </div>
                  <input placeholder="Email" value={newCliente.email} onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })} />
                  <input placeholder="Dirección" value={newCliente.direccion} onChange={(e) => setNewCliente({ ...newCliente, direccion: e.target.value })} />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Población" value={newCliente.poblacion} onChange={(e) => setNewCliente({ ...newCliente, poblacion: e.target.value })} />
                    <input placeholder="Provincia" value={newCliente.provincia} onChange={(e) => setNewCliente({ ...newCliente, provincia: e.target.value })} />
                  </div>
                  <button disabled={loading} onClick={createCliente} className="btn btn-red">Crear y continuar</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-7">
            <SectionTitle icon={<Car size={22} />} title="Paso 2 · Vehículo" subtitle="Selecciona un vehículo del cliente o crea uno nuevo." />
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div>
                <SearchBox value={vehiculoQuery} onChange={setVehiculoQuery} placeholder="Buscar matrícula, VIN, modelo, motor o ECU..." />
                <div className="space-y-3 mt-4">
                  {filteredVehiculos.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVehiculo(v)} className={cx('selection-card w-full text-left', selectedVehiculo?.id === v.id && 'selection-card-active')}>
                      <p className="font-black">{v.marca || 'Vehículo'} {v.modelo || ''}</p>
                      <p className="text-sm text-zinc-500">{v.matricula || 'Sin matrícula'} · {v.motor || 'Motor no indicado'} · {v.ecu || 'ECU no indicada'}</p>
                    </button>
                  ))}
                  {filteredVehiculos.length === 0 && <Empty text="Este cliente todavía no tiene vehículos o no coincide la búsqueda." />}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <h3 className="font-black text-lg mb-4">Crear vehículo rápido</h3>
                <div className="grid gap-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Marca" value={newVehiculo.marca} onChange={(e) => setNewVehiculo({ ...newVehiculo, marca: e.target.value })} />
                    <input placeholder="Modelo" value={newVehiculo.modelo} onChange={(e) => setNewVehiculo({ ...newVehiculo, modelo: e.target.value })} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Motor" value={newVehiculo.motor} onChange={(e) => setNewVehiculo({ ...newVehiculo, motor: e.target.value })} />
                    <input placeholder="Año" type="number" value={newVehiculo.anio} onChange={(e) => setNewVehiculo({ ...newVehiculo, anio: e.target.value })} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Matrícula" value={newVehiculo.matricula} onChange={(e) => setNewVehiculo({ ...newVehiculo, matricula: e.target.value })} />
                    <input placeholder="Bastidor / VIN" value={newVehiculo.bastidor} onChange={(e) => setNewVehiculo({ ...newVehiculo, bastidor: e.target.value })} />
                  </div>
                  <input placeholder="ECU / módulo principal" value={newVehiculo.ecu} onChange={(e) => setNewVehiculo({ ...newVehiculo, ecu: e.target.value })} />
                  <button disabled={loading || !selectedCliente} onClick={createVehiculo} className="btn btn-red">Crear y continuar</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-7">
            <SectionTitle icon={<ClipboardList size={22} />} title="Paso 3 · Tipo de trabajo" subtitle="La ficha técnica se preparará automáticamente según el trabajo elegido." />
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {workTypes.map((w) => {
                const Icon = w.icon
                return (
                  <button key={w.id} onClick={() => setSelectedWork(w)} className={cx('work-card text-left', selectedWork.id === w.id && 'work-card-active')}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-red-300"><Icon size={20} /></span>
                      <span className="font-black">{w.label}</span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">{w.description}</p>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="mt-7">
            <SectionTitle icon={<CheckCircle2 size={22} />} title="Paso 4 · Resumen" subtitle="Revisa los datos y crea la orden de trabajo." />
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <SummaryRow label="Cliente" value={selectedCliente?.nombre || '-'} />
                <SummaryRow label="Vehículo" value={`${selectedVehiculo?.marca || ''} ${selectedVehiculo?.modelo || ''} ${selectedVehiculo?.matricula || ''}`} />
                <SummaryRow label="Trabajo" value={selectedWork.label} />
                <SummaryRow label="Ficha" value={selectedWork.technical === 'ecu' ? 'ECU preparada' : selectedWork.technical === 'llaves' ? 'Llaves preparada' : selectedWork.technical === 'immo' ? 'IMMO preparada' : 'General'} />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <select value={ot.prioridad} onChange={(e) => setOt({ ...ot, prioridad: e.target.value })}>{prioridades.map((p) => <option key={p}>{p}</option>)}</select>
                  <input placeholder="Técnico" value={ot.tecnico} onChange={(e) => setOt({ ...ot, tecnico: e.target.value })} />
                </div>
                <input placeholder="Precio estimado" type="number" value={ot.precio_estimado} onChange={(e) => setOt({ ...ot, precio_estimado: e.target.value })} />
                <textarea placeholder="Descripción para cliente" value={ot.descripcion} onChange={(e) => setOt({ ...ot, descripcion: e.target.value })} />
                <textarea placeholder="Notas internas de laboratorio" value={ot.notas_internas} onChange={(e) => setOt({ ...ot, notas_internas: e.target.value })} />
                <button disabled={loading} onClick={createOT} className="btn btn-red text-lg py-4">Crear OT y abrir ficha</button>
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/10">
          <button onClick={back} disabled={step === 1} className="btn btn-dark flex items-center gap-2 disabled:opacity-40"><ArrowLeft size={17} /> Atrás</button>
          {step < 4 && <button onClick={next} className="btn btn-red flex items-center gap-2">Continuar <ArrowRight size={17} /></button>}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="card p-5">
          <h3 className="font-black text-lg mb-4">OT inteligente</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">El asistente crea la OT y prepara automáticamente la ficha técnica de ECU, llaves o IMMO según el tipo de trabajo.</p>
        </div>
        <div className="card p-5 space-y-4">
          <h3 className="font-black text-lg">Selección actual</h3>
          <SummaryRow label="Cliente" value={selectedCliente?.nombre || 'Sin seleccionar'} />
          <SummaryRow label="Vehículo" value={selectedVehiculo ? `${selectedVehiculo.marca || ''} ${selectedVehiculo.modelo || ''} ${selectedVehiculo.matricula || ''}` : 'Sin seleccionar'} />
          <SummaryRow label="Trabajo" value={selectedWork.label} />
          <SummaryRow label="Prioridad" value={ot.prioridad} />
        </div>
      </aside>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const labels = ['Cliente', 'Vehículo', 'Trabajo', 'Resumen']
  return (
    <div className="grid grid-cols-4 gap-2">
      {labels.map((label, i) => {
        const n = i + 1
        return (
          <div key={label} className={cx('rounded-2xl border p-3', step >= n ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-zinc-500')}>
            <p className="text-xs font-black uppercase tracking-widest">Paso {n}</p>
            <p className="font-bold mt-1">{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-red-300">{icon}</span>
      <div>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3">
      <Search size={18} className="text-zinc-500" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent border-0 p-0 w-full" />
    </div>
  )
}

function SummaryRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="font-black text-right">{value}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-5 text-zinc-500 text-sm">{text}</div>
}
