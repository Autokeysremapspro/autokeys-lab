'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { AgendaEvento, AgendaEventoInput } from '@/types/agenda'
import { getAgendaSelectData } from '@/lib/services/agenda'

type Option = { id: string; [key: string]: any }

type Props = {
  open: boolean
  evento?: AgendaEvento | null
  onClose: () => void
  onSave: (input: AgendaEventoInput) => Promise<void>
}

function toLocalInput(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null
}

export default function AgendaEventModal({ open, evento, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<Option[]>([])
  const [vehiculos, setVehiculos] = useState<Option[]>([])
  const [expedientes, setExpedientes] = useState<Option[]>([])
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'cita',
    estado: 'programado',
    prioridad: 'normal',
    fecha_inicio: '',
    fecha_fin: '',
    cliente_id: '',
    vehiculo_id: '',
    expediente_id: '',
    tecnico: '',
    ubicacion: '',
    notas: '',
    recordatorio_minutos: 60,
  })

  useEffect(() => {
    if (!open) return
    getAgendaSelectData()
      .then(data => {
        setClientes(data.clientes as Option[])
        setVehiculos(data.vehiculos as Option[])
        setExpedientes(data.expedientes as Option[])
      })
      .catch(console.error)
  }, [open])

  useEffect(() => {
    if (!open) return
    setForm({
      titulo: evento?.titulo || '',
      tipo: evento?.tipo || 'cita',
      estado: evento?.estado || 'programado',
      prioridad: evento?.prioridad || 'normal',
      fecha_inicio: toLocalInput(evento?.fecha_inicio) || toLocalInput(new Date().toISOString()),
      fecha_fin: toLocalInput(evento?.fecha_fin),
      cliente_id: evento?.cliente_id || '',
      vehiculo_id: evento?.vehiculo_id || '',
      expediente_id: evento?.expediente_id || '',
      tecnico: evento?.tecnico || '',
      ubicacion: evento?.ubicacion || '',
      notas: evento?.notas || '',
      recordatorio_minutos: evento?.recordatorio_minutos || 60,
    })
  }, [open, evento])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) return alert('Pon un título para la cita.')
    if (!form.fecha_inicio) return alert('Selecciona fecha y hora de inicio.')

    setSaving(true)
    try {
      await onSave({
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        estado: form.estado,
        prioridad: form.prioridad,
        fecha_inicio: toIso(form.fecha_inicio)!,
        fecha_fin: toIso(form.fecha_fin),
        cliente_id: form.cliente_id || null,
        vehiculo_id: form.vehiculo_id || null,
        expediente_id: form.expediente_id || null,
        tecnico: form.tecnico || null,
        ubicacion: form.ubicacion || null,
        notas: form.notas || null,
        recordatorio_minutos: Number(form.recordatorio_minutos || 0),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-4xl bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black">{evento ? 'Editar evento' : 'Nueva cita / evento'}</div>
            <div className="text-sm text-zinc-500 mt-1">Planificador de recepción, entregas y trabajos del laboratorio.</div>
          </div>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-2xl hover:bg-white/5 flex items-center justify-center"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
          <label className="md:col-span-2">
            <span className="label">Título *</span>
            <input className="input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Entrega BMW 320d / Recepción MD1 / Cita llaves" />
          </label>

          <label><span className="label">Tipo</span><select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="cita">Cita</option><option value="recepcion">Recepción</option><option value="entrega">Entrega</option><option value="trabajo">Trabajo laboratorio</option><option value="recordatorio">Recordatorio</option><option value="file_service">File Service</option></select></label>
          <label><span className="label">Estado</span><select className="input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}><option value="programado">Programado</option><option value="en_proceso">En proceso</option><option value="realizado">Realizado</option><option value="retrasado">Retrasado</option><option value="cancelado">Cancelado</option></select></label>
          <label><span className="label">Prioridad</span><select className="input" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
          <label><span className="label">Técnico / responsable</span><input className="input" value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })} placeholder="Carlos / Ana / Técnico" /></label>

          <label><span className="label">Inicio *</span><input type="datetime-local" className="input" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></label>
          <label><span className="label">Fin</span><input type="datetime-local" className="input" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></label>

          <label><span className="label">Cliente</span><select className="input" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}><option value="">Sin cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `· ${c.telefono}` : ''}</option>)}</select></label>
          <label><span className="label">Vehículo</span><select className="input" value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })}><option value="">Sin vehículo</option>{vehiculos.map(v => <option key={v.id} value={v.id}>{[v.marca, v.modelo, v.matricula].filter(Boolean).join(' · ') || 'Vehículo'}</option>)}</select></label>
          <label><span className="label">Expediente / OT</span><select className="input" value={form.expediente_id} onChange={e => setForm({ ...form, expediente_id: e.target.value })}><option value="">Sin OT</option>{expedientes.map(ot => <option key={ot.id} value={ot.id}>{[ot.numero_ot, ot.tipo_trabajo, ot.estado].filter(Boolean).join(' · ') || 'OT'}</option>)}</select></label>
          <label><span className="label">Recordatorio</span><select className="input" value={form.recordatorio_minutos} onChange={e => setForm({ ...form, recordatorio_minutos: Number(e.target.value) })}><option value={0}>Sin recordatorio</option><option value={15}>15 minutos antes</option><option value={30}>30 minutos antes</option><option value={60}>1 hora antes</option><option value={1440}>1 día antes</option></select></label>

          <label className="md:col-span-2"><span className="label">Ubicación</span><input className="input" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Recepción / Laboratorio / Zona vehículos / Online" /></label>
          <label className="md:col-span-2"><span className="label">Notas</span><textarea className="input min-h-[110px]" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones, material pendiente, aviso al cliente, etc." /></label>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn">Cancelar</button>
          <button disabled={saving} className="btn btn-red">{saving ? 'Guardando...' : 'Guardar evento'}</button>
        </div>
      </form>
    </div>
  )
}
