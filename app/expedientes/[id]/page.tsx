'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ExpedienteStatusBadge from '@/components/ExpedienteStatusBadge'
import TechnicalField from '@/components/TechnicalField'
import ExpedienteFilesPanel from '@/components/ExpedienteFilesPanel'
import { ExpedienteService } from '@/lib/services/expedientes'
import type { ExpedienteConRelaciones, ExpedienteECU, ExpedienteLlaves } from '@/types/autokeys'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Cpu,
  FileText,
  FolderOpen,
  Camera,
  History,
  KeyRound,
  Save,
  UserRound,
} from 'lucide-react'

const estados = ['recibido', 'diagnostico', 'en_proceso', 'pendiente_cliente', 'pendiente_material', 'terminado', 'entregado', 'cancelado']
const prioridades = ['baja', 'normal', 'alta', 'urgente']
const tabs = ['Resumen', 'ECU', 'Llaves', 'Archivos', 'Fotos', 'Checklist', 'Historial'] as const

type Tab = typeof tabs[number]

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

function defaultECU(expediente_id: string): ExpedienteECU {
  return { expediente_id, marca_ecu: '', modelo_ecu: '', hw: '', sw: '', vin_original: '', cvn: '', password: '', pin: '', cs: '', mac: '', isn: '', estado_immo: '', stage: '', dpf: '', egr: '', adblue: '', checksum: '', lectura: '', herramienta: '', notas: '' }
}

function defaultLlaves(expediente_id: string): ExpedienteLlaves {
  return { expediente_id, llaves_originales: 0, llaves_programadas: 0, tipo_llave: '', frecuencia: '', transponder: '', mando: '', plataforma: '', pin: '', cs: '', mac: '', isn: '', estado: '', notas: '' }
}

function checklistFor(tipo?: string | null) {
  const text = (tipo || '').toLowerCase()
  if (text.includes('llave') || text.includes('fem') || text.includes('cas') || text.includes('bdc')) {
    return ['Confirmar autorización arranque', 'Leer datos immo', 'Guardar backup', 'Programar llave', 'Probar mando', 'Probar arranque', 'Diagnosis final', 'Entregado']
  }
  if (text.includes('reprogram') || text.includes('stage')) {
    return ['Leer original', 'Identificar HW/SW', 'Guardar backup', 'Modificar archivo', 'Checksum OK', 'Escribir archivo', 'Diagnosis final', 'Prueba dinámica']
  }
  if (text.includes('ecu') || text.includes('clon')) {
    return ['Leer Flash', 'Leer EEPROM', 'Guardar original', 'Guardar donante', 'Clonar datos', 'Escribir unidad', 'Comprobar arranque', 'Diagnosis final']
  }
  return ['Recepción', 'Diagnóstico', 'Trabajo realizado', 'Prueba final', 'Cliente avisado', 'Entregado']
}

export default function ExpedienteFichaPage() {
  const params = useParams()
  const id = String(params.id)

  const [item, setItem] = useState<ExpedienteConRelaciones | null>(null)
  const [ecu, setEcu] = useState<ExpedienteECU | null>(null)
  const [llaves, setLlaves] = useState<ExpedienteLlaves | null>(null)
  const [tab, setTab] = useState<Tab>('Resumen')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await ExpedienteService.getById(id)
      setItem(data)
      setEcu(data?.ecu || defaultECU(id))
      setLlaves(data?.llaves || defaultLlaves(id))
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la OT')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const checklist = useMemo(() => checklistFor(item?.tipo_trabajo), [item?.tipo_trabajo])

  async function saveExpediente() {
    if (!item) return
    setSaving(true); setError(''); setOk('')
    try {
      await ExpedienteService.update(item.id, {
        estado: item.estado,
        prioridad: item.prioridad,
        tecnico: item.tecnico,
        precio_estimado: item.precio_estimado,
        precio_final: item.precio_final,
        descripcion: item.descripcion,
        notas_cliente: item.notas_cliente,
        notas_internas: item.notas_internas,
      })
      await ExpedienteService.addHistory(item.id, 'Expediente actualizado', `Estado: ${item.estado || 'sin estado'}`)
      setOk('Expediente guardado')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo guardar') }
    finally { setSaving(false) }
  }

  async function saveECU() {
    if (!ecu) return
    setSaving(true); setError(''); setOk('')
    try {
      await ExpedienteService.upsertECU(id, ecu)
      await ExpedienteService.addHistory(id, 'Ficha ECU actualizada', `${ecu.marca_ecu || ''} ${ecu.modelo_ecu || ''}`.trim())
      setOk('Ficha ECU guardada')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo guardar ECU') }
    finally { setSaving(false) }
  }

  async function saveLlaves() {
    if (!llaves) return
    setSaving(true); setError(''); setOk('')
    try {
      await ExpedienteService.upsertLlaves(id, llaves)
      await ExpedienteService.addHistory(id, 'Ficha llaves actualizada', `${llaves.tipo_llave || ''} ${llaves.frecuencia || ''}`.trim())
      setOk('Ficha de llaves guardada')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo guardar llaves') }
    finally { setSaving(false) }
  }

  async function markChecklist(point: string) {
    setSaving(true); setError(''); setOk('')
    try {
      await ExpedienteService.addHistory(id, `Checklist: ${point}`, 'Marcado desde la ficha técnica')
      setOk('Punto registrado en historial')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo registrar') }
    finally { setSaving(false) }
  }

  if (loading) return <AppShell><div className="card p-8 text-zinc-400">Cargando ficha técnica...</div></AppShell>
  if (!item) return <AppShell><div className="card p-8 text-red-300">OT no encontrada.</div></AppShell>

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/expedientes" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4"><ArrowLeft size={18} /> Volver a expedientes</Link>
        <div className="card p-6">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Expediente inteligente</p>
                <ExpedienteStatusBadge status={item.estado} />
              </div>
              <h2 className="text-3xl lg:text-5xl font-black mt-2">{item.numero_ot || 'OT sin número'}</h2>
              <p className="text-zinc-400 mt-2 text-lg">{item.tipo_trabajo}</p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-2"><UserRound size={17} /> {item.cliente?.nombre || 'Sin cliente'}</span>
                <span className="inline-flex items-center gap-2"><Car size={17} /> {[item.vehiculo?.marca, item.vehiculo?.modelo, item.vehiculo?.matricula].filter(Boolean).join(' · ') || 'Sin vehículo'}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={17} /> {formatDate(item.created_at)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4"><p className="text-xs text-zinc-500 font-black uppercase">Estimado</p><p className="text-xl font-black">{money(item.precio_estimado)}</p></div>
              <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-4"><p className="text-xs text-zinc-500 font-black uppercase">Final</p><p className="text-xl font-black">{money(item.precio_final)}</p></div>
            </div>
          </div>
        </div>
      </div>

      {(error || ok) && <div className={`card p-4 mb-5 ${error ? 'text-red-300 border-red-500/30' : 'text-emerald-300 border-emerald-500/30'}`}>{error || ok}</div>}

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-red' : 'btn-dark'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Resumen' && (
        <div className="grid xl:grid-cols-3 gap-5">
          <div className="card p-6 xl:col-span-2">
            <h3 className="text-2xl font-black mb-5 flex items-center gap-2"><FileText className="text-red-300" /> Resumen de OT</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-2"><span className="text-xs font-black uppercase text-zinc-400">Estado</span><select value={item.estado || 'recibido'} onChange={e => setItem({ ...item, estado: e.target.value })}>{estados.map(e => <option key={e}>{e}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-black uppercase text-zinc-400">Prioridad</span><select value={item.prioridad || 'normal'} onChange={e => setItem({ ...item, prioridad: e.target.value })}>{prioridades.map(e => <option key={e}>{e}</option>)}</select></label>
              <TechnicalField label="Técnico" value={item.tecnico} onChange={v => setItem({ ...item, tecnico: v })} />
              <TechnicalField label="Precio estimado" type="number" value={item.precio_estimado || 0} onChange={v => setItem({ ...item, precio_estimado: Number(v) })} />
              <TechnicalField label="Precio final" type="number" value={item.precio_final || 0} onChange={v => setItem({ ...item, precio_final: Number(v) })} />
              <div />
              <TechnicalField label="Descripción" textarea value={item.descripcion} onChange={v => setItem({ ...item, descripcion: v })} />
              <TechnicalField label="Notas cliente" textarea value={item.notas_cliente} onChange={v => setItem({ ...item, notas_cliente: v })} />
              <TechnicalField label="Notas internas" textarea value={item.notas_internas} onChange={v => setItem({ ...item, notas_internas: v })} />
            </div>
            <button disabled={saving} onClick={saveExpediente} className="btn btn-red mt-5 inline-flex items-center gap-2"><Save size={18} /> {saving ? 'Guardando...' : 'Guardar resumen'}</button>
          </div>

          <div className="card p-6">
            <h3 className="text-2xl font-black mb-5">Datos rápidos</h3>
            <div className="space-y-4 text-sm">
              <div><p className="text-zinc-500 font-bold">Cliente</p><p className="font-black">{item.cliente?.nombre || '-'}</p><p className="text-zinc-400">{item.cliente?.telefono || ''}</p></div>
              <div><p className="text-zinc-500 font-bold">Vehículo</p><p className="font-black">{item.vehiculo?.marca} {item.vehiculo?.modelo}</p><p className="text-zinc-400">{item.vehiculo?.matricula || ''} · {item.vehiculo?.bastidor || ''}</p></div>
              <div><p className="text-zinc-500 font-bold">ECU vehículo</p><p className="font-black">{item.vehiculo?.ecu || item.ecu?.modelo_ecu || '-'}</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'ECU' && ecu && (
        <div className="card p-6">
          <h3 className="text-2xl font-black mb-5 flex items-center gap-2"><Cpu className="text-red-300" /> Ficha ECU</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <TechnicalField label="Marca ECU" value={ecu.marca_ecu} onChange={v => setEcu({ ...ecu, marca_ecu: v })} placeholder="Bosch, Delphi, Continental..." />
            <TechnicalField label="Modelo ECU" value={ecu.modelo_ecu} onChange={v => setEcu({ ...ecu, modelo_ecu: v })} placeholder="MD1CS003, EDC17C50..." />
            <TechnicalField label="Herramienta" value={ecu.herramienta} onChange={v => setEcu({ ...ecu, herramienta: v })} placeholder="Flex, Kess V3, Autel..." />
            <TechnicalField label="HW" value={ecu.hw} onChange={v => setEcu({ ...ecu, hw: v })} />
            <TechnicalField label="SW" value={ecu.sw} onChange={v => setEcu({ ...ecu, sw: v })} />
            <TechnicalField label="CVN" value={ecu.cvn} onChange={v => setEcu({ ...ecu, cvn: v })} />
            <TechnicalField label="VIN original" value={ecu.vin_original} onChange={v => setEcu({ ...ecu, vin_original: v })} />
            <TechnicalField label="VIN nuevo" value={ecu.vin_nuevo} onChange={v => setEcu({ ...ecu, vin_nuevo: v })} />
            <TechnicalField label="Password" value={ecu.password} onChange={v => setEcu({ ...ecu, password: v })} />
            <TechnicalField label="PIN" value={ecu.pin} onChange={v => setEcu({ ...ecu, pin: v })} />
            <TechnicalField label="CS" value={ecu.cs} onChange={v => setEcu({ ...ecu, cs: v })} />
            <TechnicalField label="MAC" value={ecu.mac} onChange={v => setEcu({ ...ecu, mac: v })} />
            <TechnicalField label="ISN" value={ecu.isn} onChange={v => setEcu({ ...ecu, isn: v })} />
            <TechnicalField label="Estado IMMO" value={ecu.estado_immo} onChange={v => setEcu({ ...ecu, estado_immo: v })} placeholder="Activo, OFF, virgin..." />
            <TechnicalField label="Stage" value={ecu.stage} onChange={v => setEcu({ ...ecu, stage: v })} />
            <TechnicalField label="DPF" value={ecu.dpf} onChange={v => setEcu({ ...ecu, dpf: v })} />
            <TechnicalField label="EGR" value={ecu.egr} onChange={v => setEcu({ ...ecu, egr: v })} />
            <TechnicalField label="AdBlue / SCR" value={ecu.adblue} onChange={v => setEcu({ ...ecu, adblue: v })} />
            <TechnicalField label="Checksum" value={ecu.checksum} onChange={v => setEcu({ ...ecu, checksum: v })} placeholder="Correcto, pendiente..." />
            <TechnicalField label="Lectura" value={ecu.lectura} onChange={v => setEcu({ ...ecu, lectura: v })} placeholder="Bench, Boot, OBD..." />
            <div className="md:col-span-3"><TechnicalField label="Notas ECU" textarea value={ecu.notas} onChange={v => setEcu({ ...ecu, notas: v })} /></div>
          </div>
          <button disabled={saving} onClick={saveECU} className="btn btn-red mt-5 inline-flex items-center gap-2"><Save size={18} /> {saving ? 'Guardando...' : 'Guardar ECU'}</button>
        </div>
      )}

      {tab === 'Llaves' && llaves && (
        <div className="card p-6">
          <h3 className="text-2xl font-black mb-5 flex items-center gap-2"><KeyRound className="text-red-300" /> Ficha llaves / IMMO</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <TechnicalField label="Llaves originales" type="number" value={llaves.llaves_originales || 0} onChange={v => setLlaves({ ...llaves, llaves_originales: Number(v) })} />
            <TechnicalField label="Llaves programadas" type="number" value={llaves.llaves_programadas || 0} onChange={v => setLlaves({ ...llaves, llaves_programadas: Number(v) })} />
            <TechnicalField label="Tipo llave" value={llaves.tipo_llave} onChange={v => setLlaves({ ...llaves, tipo_llave: v })} placeholder="Smart, mando, transponder..." />
            <TechnicalField label="Frecuencia" value={llaves.frecuencia} onChange={v => setLlaves({ ...llaves, frecuencia: v })} placeholder="433MHz, 868MHz..." />
            <TechnicalField label="Transponder" value={llaves.transponder} onChange={v => setLlaves({ ...llaves, transponder: v })} placeholder="ID48, PCF7936, MQB..." />
            <TechnicalField label="Mando" value={llaves.mando} onChange={v => setLlaves({ ...llaves, mando: v })} />
            <TechnicalField label="Plataforma" value={llaves.plataforma} onChange={v => setLlaves({ ...llaves, plataforma: v })} placeholder="CAS, FEM, BDC, EZS..." />
            <TechnicalField label="PIN" value={llaves.pin} onChange={v => setLlaves({ ...llaves, pin: v })} />
            <TechnicalField label="CS" value={llaves.cs} onChange={v => setLlaves({ ...llaves, cs: v })} />
            <TechnicalField label="MAC" value={llaves.mac} onChange={v => setLlaves({ ...llaves, mac: v })} />
            <TechnicalField label="ISN" value={llaves.isn} onChange={v => setLlaves({ ...llaves, isn: v })} />
            <TechnicalField label="Estado" value={llaves.estado} onChange={v => setLlaves({ ...llaves, estado: v })} placeholder="OK, pendiente, revisar..." />
            <div className="md:col-span-3"><TechnicalField label="Notas llaves" textarea value={llaves.notas} onChange={v => setLlaves({ ...llaves, notas: v })} /></div>
          </div>
          <button disabled={saving} onClick={saveLlaves} className="btn btn-red mt-5 inline-flex items-center gap-2"><Save size={18} /> {saving ? 'Guardando...' : 'Guardar llaves'}</button>
        </div>
      )}


      {tab === 'Archivos' && (
        <ExpedienteFilesPanel
          expedienteId={id}
          mode="archivos"
          title="Archivos técnicos"
          description="Guarda originales, modificados, flash, EEPROM, full backup, dumps y documentación técnica de esta OT."
          icon={<FolderOpen className="text-red-300" />}
          onEvent={async (evento, descripcion) => {
            await ExpedienteService.addHistory(id, evento, descripcion)
            await load()
          }}
        />
      )}

      {tab === 'Fotos' && (
        <ExpedienteFilesPanel
          expedienteId={id}
          mode="fotos"
          title="Fotografías del expediente"
          description="Organiza fotos de vehículo, matrícula, VIN, ECU, etiqueta, cuadro, llave y avería."
          icon={<Camera className="text-red-300" />}
          onEvent={async (evento, descripcion) => {
            await ExpedienteService.addHistory(id, evento, descripcion)
            await load()
          }}
        />
      )}

      {tab === 'Checklist' && (
        <div className="card p-6">
          <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><ClipboardCheck className="text-red-300" /> Checklist inteligente</h3>
          <p className="text-zinc-500 mb-5">Plantilla sugerida según el tipo de trabajo. Al marcar un punto queda registrado en el historial.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {checklist.map(point => (
              <button key={point} onClick={() => markChecklist(point)} disabled={saving} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 text-left hover:border-red-500/40 hover:bg-red-500/10 transition flex items-center gap-3">
                <CheckCircle2 className="text-emerald-300" size={22} />
                <span className="font-black">{point}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'Historial' && (
        <div className="card p-6">
          <h3 className="text-2xl font-black mb-5 flex items-center gap-2"><History className="text-red-300" /> Historial técnico</h3>
          <div className="space-y-3">
            {(item.historial || []).map(h => (
              <div key={h.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <p className="font-black">{h.evento}</p>
                  <p className="text-xs text-zinc-500">{formatDate(h.created_at)}</p>
                </div>
                {h.descripcion && <p className="text-zinc-400 mt-2">{h.descripcion}</p>}
                <p className="text-xs text-zinc-600 mt-2">{h.usuario || 'Autokeys Core'}</p>
              </div>
            ))}
            {!item.historial?.length && <div className="text-zinc-500">Aún no hay eventos registrados.</div>}
          </div>
        </div>
      )}
    </AppShell>
  )
}
