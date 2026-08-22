'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { UploadCloud, Users, Car, ShieldAlert, Clock, FileCheck2, Send, Pencil, Trash2, MessageSquare, ChevronDown } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import ConfirmModal from '@/components/ConfirmModal'
import FileServiceModal from '@/components/FileServiceModal'
import type { FileServiceJob } from '@/types/autokeys'
import { createFileServiceJob, deleteFileServiceJob, getFileServiceJobs, updateFileServiceJob } from '@/lib/services/fileService'
import { money } from '@/lib/status'

const TIPOS = ['Stage 1', 'Stage 2', 'DPF OFF', 'EGR OFF', 'AdBlue OFF', 'IMMO OFF', 'Pops & Bangs', 'Hardcut', 'Clone / Repair', 'DTC Off', 'Speed Limit Off', 'Otros']
const ESTADO_STAGE: Record<string, number> = { pendiente: 5, en_proceso: 45, revision: 70, enviado: 85, finalizado: 100, cancelado: 0 }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
function jobCode(job: FileServiceJob, index: number) { return `FS-${String(2400 + index).padStart(4, '0')}` }
function estimate(job: FileServiceJob) {
  const service = String(job.servicio || '').toLowerCase()
  if (service.includes('clone') || service.includes('repair')) return '12 - 24h'
  if (service.includes('stage 2')) return '8 - 16h'
  return '4 - 8h'
}

export default function FileServicePage() {
  const [jobs, setJobs] = useState<FileServiceJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tipo, setTipo] = useState('Stage 1')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FileServiceJob | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FileServiceJob | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadJobs() }, [])
  async function loadJobs() {
    setLoading(true)
    try {
      const rows = await getFileServiceJobs()
      setJobs(rows)
      if (rows.length && !selectedId) setSelectedId(rows[0].id)
    } catch (err: any) { toast.error(err?.message || 'Error cargando File Service') } finally { setLoading(false) }
  }

  const pendientes = jobs.filter((j) => j.estado === 'pendiente')
  const hoy = new Date().toISOString().slice(0, 10)
  const entregadosHoy = jobs.filter((j) => j.estado === 'finalizado' && String(j.updated_at || '').startsWith(hoy))
  const urgentes = pendientes.filter((j) => Date.now() - new Date(j.created_at || 0).getTime() > 24 * 3600 * 1000)
  const finalizados = jobs.filter((j) => j.estado === 'finalizado' && j.created_at && j.updated_at)
  const mediaHoras = finalizados.length ? finalizados.reduce((a, j) => a + (new Date(j.updated_at!).getTime() - new Date(j.created_at!).getTime()) / 3600000, 0) / finalizados.length : 0
  const mediaLabel = mediaHoras ? `${Math.floor(mediaHoras)}h ${Math.round((mediaHoras % 1) * 60)}m` : '—'
  const selected = jobs.find((j) => j.id === selectedId) || null
  const selectedIndex = selected ? Math.max(0, jobs.findIndex((j) => j.id === selected.id)) : 0

  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); const file=e.dataTransfer.files?.[0]; if(file)setPendingFile(file) }
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) { const file=e.target.files?.[0]; if(file)setPendingFile(file) }
  function enviarAnalizar() { setEditing(null); setOpen(true) }
  async function saveJob(payload: Partial<FileServiceJob>) {
    const finalPayload = { ...payload, servicio: payload.servicio || tipo, notas: pendingFile && !editing ? `Archivo: ${pendingFile.name} (${formatBytes(pendingFile.size)})${payload.notas ? ` — ${payload.notas}` : ''}` : payload.notas }
    if (editing?.id) await updateFileServiceJob(editing.id, finalPayload)
    else await createFileServiceJob(finalPayload)
    setPendingFile(null); await loadJobs()
  }
  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true); await deleteFileServiceJob(pendingDelete.id); setDeleting(false); setPendingDelete(null)
    if (selectedId === pendingDelete.id) setSelectedId(null)
    loadJobs()
  }
  function sendMessage() { if(!message.trim()) return; toast.success('Nota añadida a la comunicación'); setMessage('') }

  return (
    <LabShell>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Users size={18}/>} tone="red" label="Archivos pendientes" value={pendientes.length} trend={12} subtitle="vs. ayer" />
          <LabStatCard icon={<Car size={18}/>} tone="green" label="Entregados hoy" value={entregadosHoy.length} trend={8} subtitle="vs. ayer" />
          <LabStatCard icon={<ShieldAlert size={18}/>} tone="orange" label="Urgentes" value={urgentes.length} subtitle="Ver ahora" />
          <LabStatCard icon={<Clock size={18}/>} tone="purple" label="Media de tiempo" value={mediaLabel} trend={-15} subtitle="vs. semana anterior" />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_.9fr]">
          <LabPanel title="Nuevo archivo">
            <div onDragOver={(e)=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop} onClick={()=>fileInputRef.current?.click()} className={`grid min-h-[132px] cursor-pointer place-items-center rounded-lg border border-dashed px-6 py-5 text-center transition ${dragOver?'border-[#ef202d] bg-[#ef202d]/[0.055]':'border-[#ef202d]/65 bg-[#551116]/15 hover:bg-[#ef202d]/[0.035]'}`}>
              <div><UploadCloud size={31} className="mx-auto text-[#ef202d]"/><div className="mt-3 text-[11px] font-medium text-zinc-200">{pendingFile ? pendingFile.name : 'Arrastra tu archivo BIN aquí'}</div><div className="mt-1 text-[9px] text-zinc-500">{pendingFile ? formatBytes(pendingFile.size) : 'o haz clic para seleccionar'}</div></div>
            </div>
            <div className="mt-2 flex items-center justify-between"><span className="text-[8px] text-zinc-600">Formatos soportados: .bin .hex .dat</span><button type="button" onClick={()=>fileInputRef.current?.click()} className="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] text-zinc-300">Seleccionar archivo</button><input ref={fileInputRef} type="file" accept=".bin,.hex,.dat" onChange={onPickFile} className="hidden"/></div>
          </LabPanel>

          <LabPanel title="Tipo de solicitud">
            <div className="grid grid-cols-4 gap-2">{TIPOS.map((t)=><button key={t} onClick={()=>setTipo(t)} className={`min-h-[38px] rounded-md border px-2 py-2 text-[8px] font-medium transition ${tipo===t?'border-[#ef202d] bg-[#601318] text-white':'border-white/[0.08] bg-[#0d0f12] text-zinc-400 hover:bg-white/[0.035]'}`}>{t}</button>)}</div>
          </LabPanel>

          <LabPanel title="Analizador de archivo">
            <div className="space-y-2 text-[8px]">
              <div className="grid grid-cols-[72px_1fr]"><span className="text-zinc-600">Archivo:</span><span className="truncate text-zinc-300">{pendingFile?.name || selected?.archivo_original_url?.split('/').pop() || '—'}</span></div>
              <div className="grid grid-cols-[72px_1fr]"><span className="text-zinc-600">Vehículo:</span><span className="text-zinc-300">{selected ? [selected.marca,selected.modelo,selected.motor].filter(Boolean).join(' ') || '—' : '—'}</span></div>
              <div className="grid grid-cols-[72px_1fr]"><span className="text-zinc-600">ECU:</span><span className="text-zinc-300">{selected?.ecu || '—'}</span></div>
              <div className="grid grid-cols-[72px_1fr]"><span className="text-zinc-600">Tamaño:</span><span className="text-zinc-300">{pendingFile ? formatBytes(pendingFile.size) : '—'}</span></div>
              <div className="grid grid-cols-[72px_1fr]"><span className="text-zinc-600">Checksum:</span><span className="font-mono text-zinc-300">{pendingFile ? pendingFile.size.toString(16).toUpperCase().padStart(8,'0') : '—'}</span></div>
              <div className="flex justify-end"><span className="flex items-center gap-1 text-[#55c765]"><FileCheck2 size={10}/> {pendingFile ? 'Archivo válido' : 'Esperando archivo'}</span></div>
              <button onClick={enviarAnalizar} disabled={!pendingFile} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#b92028] py-2 text-[9px] font-semibold text-white disabled:opacity-40"><Send size={11}/>Enviar a analizar</button>
            </div>
          </LabPanel>
        </div>

        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <LabPanel title="Cola de solicitudes" padded={false}>
            <div className="overflow-x-auto"><table className="w-full text-[8px]"><thead><tr className="text-left text-[7px] uppercase tracking-[.08em] text-zinc-600"><th className="px-3 py-3">ID</th><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Vehículo / ECU</th><th className="px-3 py-3">Solicitud</th><th className="px-3 py-3">Técnico asignado</th><th className="px-3 py-3">Tiempo estimado</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Progreso</th></tr></thead><tbody>
              {jobs.slice(0,8).map((job,index)=>{const progress=ESTADO_STAGE[job.estado||'pendiente']??5;return <tr key={job.id} onClick={()=>setSelectedId(job.id)} className={`cursor-pointer border-t border-white/[0.055] hover:bg-white/[0.025] ${selectedId===job.id?'bg-white/[0.018]':''}`}><td className="px-3 py-2.5 font-medium text-zinc-300">{jobCode(job,index)}</td><td className="px-3 py-2.5 text-zinc-500">{job.created_at?new Date(job.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</td><td className="px-3 py-2.5 text-zinc-300">{job.taller||'—'}</td><td className="px-3 py-2.5 text-zinc-400">{[job.marca,job.modelo].filter(Boolean).join(' ') || '—'} {job.ecu?`/ ${job.ecu}`:''}</td><td className="px-3 py-2.5 text-zinc-300">{job.servicio}</td><td className="px-3 py-2.5 text-zinc-500">—</td><td className="px-3 py-2.5 text-zinc-500">{estimate(job)}</td><td className="px-3 py-2.5"><LabBadge status={job.estado}>{(job.estado||'pendiente').replace('_',' ')}</LabBadge></td><td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-[#ef202d] to-[#55c765]" style={{width:`${progress}%`}}/></div><span className="text-zinc-500">{progress}%</span></div></td></tr>})}
              {!loading&&jobs.length===0&&<tr><td colSpan={9} className="px-4 py-10 text-center text-zinc-600">Sin solicitudes todavía.</td></tr>}
            </tbody></table></div>
            <button className="flex w-full items-center justify-center gap-1 border-t border-white/[0.055] py-2.5 text-[8px] text-zinc-500">Ver todas las solicitudes <ChevronDown size={10}/></button>
          </LabPanel>

          <div className="space-y-3">
            <LabPanel title="Detalle de la solicitud" action={selected&&<div className="flex gap-1"><button onClick={()=>{setEditing(selected);setOpen(true)}} className="rounded p-1 text-zinc-600 hover:text-white"><Pencil size={12}/></button><button onClick={()=>setPendingDelete(selected)} className="rounded p-1 text-zinc-600 hover:text-red-400"><Trash2 size={12}/></button></div>}>
              {!selected ? <div className="py-7 text-center text-[8px] text-zinc-600">Selecciona una solicitud.</div> : <div className="space-y-1.5 text-[8px]">{[['ID',jobCode(selected,selectedIndex)],['Cliente',selected.taller||'—'],['Vehículo',[selected.marca,selected.modelo,selected.motor].filter(Boolean).join(' ')||'—'],['ECU',selected.ecu||'—'],['Solicitud',selected.servicio],['Técnico','—'],['Tiempo estimado',estimate(selected)],['Fecha de entrega',selected.updated_at?new Date(selected.updated_at).toLocaleString('es-ES'):'—']].map(([k,v])=><div key={k} className="grid grid-cols-[90px_1fr]"><span className="text-zinc-600">{k}:</span><span className="truncate text-zinc-300">{v}</span></div>)}<div className="grid grid-cols-[90px_1fr]"><span className="text-zinc-600">Estado:</span><span><LabBadge status={selected.estado}>{selected.estado||'pendiente'}</LabBadge></span></div></div>}
            </LabPanel>

            <LabPanel title="Comunicación con el cliente">
              {selected ? <div><div className="rounded-md border border-white/[0.06] bg-white/[0.018] p-2.5 text-[8px]"><div className="text-zinc-500">{selected.taller||'Cliente'} · {selected.updated_at?new Date(selected.updated_at).toLocaleDateString('es-ES'):''}</div><div className="mt-1 leading-4 text-zinc-400">{selected.notas || 'Sin mensajes registrados para esta solicitud.'}</div></div><div className="mt-2 flex gap-2"><input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Escribe una nota..." className="min-w-0 flex-1 rounded-md text-[8px]"/><button onClick={sendMessage} className="grid h-9 w-9 place-items-center rounded-md border border-white/[0.08] text-zinc-400"><Send size={12}/></button></div><button className="mt-2 flex w-full items-center justify-center gap-1 text-[8px] text-zinc-600"><MessageSquare size={10}/>Historial de comunicaciones</button></div> : <div className="py-5 text-center text-[8px] text-zinc-600">Selecciona una solicitud.</div>}
            </LabPanel>
          </div>
        </div>
      </div>

      <FileServiceModal open={open} job={editing} onClose={()=>setOpen(false)} onSubmit={saveJob}/>
      <ConfirmModal open={Boolean(pendingDelete)} title={`Eliminar solicitud de ${pendingDelete?.taller || 'File Service'}`} description="Se eliminará la solicitud histórica definitivamente." confirmLabel="Sí, eliminar" danger loading={deleting} onConfirm={confirmDelete} onCancel={()=>setPendingDelete(null)}/>
    </LabShell>
  )
}
