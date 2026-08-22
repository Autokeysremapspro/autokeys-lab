'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { UploadCloud, Users, Car, ShieldAlert, Clock, FileCheck2, Send, Pencil, Trash2 } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import ConfirmModal from '@/components/ConfirmModal'
import FileServiceModal from '@/components/FileServiceModal'
import type { FileServiceJob } from '@/types/autokeys'
import { createFileServiceJob, deleteFileServiceJob, getFileServiceJobs, updateFileServiceJob } from '@/lib/services/fileService'
import { money } from '@/lib/status'

const TIPOS = ['Stage 1', 'Stage 2', 'DPF OFF', 'EGR OFF', 'AdBlue / SCR OFF', 'IMMO OFF', 'Pops & Bangs', 'Hardcut', 'Clone / Repair', 'DTC Off', 'Speed Limit Off', 'Otro']

const ESTADO_STAGE: Record<string, number> = { pendiente: 5, en_proceso: 45, revision: 70, enviado: 85, finalizado: 100, cancelado: 0 }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadJobs() }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const rows = await getFileServiceJobs()
      setJobs(rows)
      if (rows.length && !selectedId) setSelectedId(rows[0].id)
    } catch (err: any) {
      toast.error(err?.message || 'Error cargando File Service')
    } finally {
      setLoading(false)
    }
  }

  const pendientes = jobs.filter((j) => j.estado === 'pendiente')
  const hoy = new Date().toISOString().slice(0, 10)
  const entregadosHoy = jobs.filter((j) => j.estado === 'finalizado' && String(j.updated_at || '').startsWith(hoy))
  const urgentes = pendientes.filter((j) => Date.now() - new Date(j.created_at || 0).getTime() > 24 * 3600 * 1000)
  const finalizados = jobs.filter((j) => j.estado === 'finalizado' && j.created_at && j.updated_at)
  const mediaHoras = finalizados.length
    ? finalizados.reduce((a, j) => a + (new Date(j.updated_at!).getTime() - new Date(j.created_at!).getTime()) / 3600000, 0) / finalizados.length
    : 0
  const mediaLabel = mediaHoras ? `${Math.floor(mediaHoras)}h ${Math.round((mediaHoras % 1) * 60)}m` : '—'

  const selected = jobs.find((j) => j.id === selectedId) || null

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setPendingFile(file)
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file)
  }

  function enviarAnalizar() {
    setEditing(null)
    setOpen(true)
  }

  async function saveJob(payload: Partial<FileServiceJob>) {
    const finalPayload = {
      ...payload,
      servicio: payload.servicio || tipo,
      notas: pendingFile && !editing ? `Archivo: ${pendingFile.name} (${formatBytes(pendingFile.size)})${payload.notas ? ` — ${payload.notas}` : ''}` : payload.notas,
    }
    if (editing?.id) await updateFileServiceJob(editing.id, finalPayload)
    else await createFileServiceJob(finalPayload)
    setPendingFile(null)
    await loadJobs()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteFileServiceJob(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
    if (selectedId === pendingDelete.id) setSelectedId(null)
    loadJobs()
  }

  return (
    <LabShell title="File Service">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<Users size={19} />} tone="red" label="Archivos pendientes" value={pendientes.length} trend={12} subtitle="vs. ayer" />
          <LabStatCard icon={<Car size={19} />} tone="green" label="Entregados hoy" value={entregadosHoy.length} trend={8} subtitle="vs. ayer" />
          <LabStatCard icon={<ShieldAlert size={19} />} tone="orange" label="Urgentes" value={urgentes.length} subtitle="Pendientes +24h" />
          <LabStatCard icon={<Clock size={19} />} tone="blue" label="Media de tiempo" value={mediaLabel} trend={-15} subtitle="vs. semana anterior" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_320px]">
          <LabPanel title="Nuevo archivo">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragOver ? 'border-[#ff5468] bg-[#c81f2a]/[0.06]' : 'border-white/10 bg-white/[0.015] hover:border-white/20'}`}
            >
              <UploadCloud size={34} className="mb-3 text-[#ff5468]" />
              <div className="text-sm font-bold text-white">{pendingFile ? pendingFile.name : 'Arrastra tu archivo BIN aquí'}</div>
              <div className="mt-1 text-xs text-zinc-500">{pendingFile ? formatBytes(pendingFile.size) : 'o haz clic para seleccionar'}</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.08]">Seleccionar archivo</button>
              <input ref={fileInputRef} type="file" accept=".bin,.hex,.dat" onChange={onPickFile} className="hidden" />
            </div>
            <div className="mt-2 text-center text-[11px] text-zinc-600">Formatos soportados: .bin .hex .dat</div>
          </LabPanel>

          <LabPanel title="Tipo de solicitud">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${tipo === t ? 'border-[#c81f2a]/50 bg-[#c81f2a]/15 text-white' : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </LabPanel>

          <LabPanel title="Analizador de archivo">
            {pendingFile ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Archivo</span><span className="max-w-[60%] truncate text-right font-bold text-zinc-200">{pendingFile.name}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Solicitud</span><span className="font-bold text-zinc-200">{tipo}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Tamaño</span><span className="font-bold text-zinc-200">{formatBytes(pendingFile.size)}</span></div>
                <div className="flex items-center justify-between pb-1"><span className="text-zinc-600">Estado</span><span className="flex items-center gap-1.5 font-bold text-[#4ade95]"><FileCheck2 size={13} /> Archivo listo</span></div>
                <button onClick={enviarAnalizar} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c81f2a] py-2.5 text-xs font-bold text-white hover:bg-[#e2242f]">
                  <Send size={14} /> Enviar a analizar
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-600">Selecciona un archivo para ver su análisis.</div>
            )}
          </LabPanel>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_360px]">
          <LabPanel title="Cola de solicitudes" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Fecha</th>
                    <th className="px-3 py-3 font-bold">Cliente</th>
                    <th className="px-3 py-3 font-bold">Vehículo / ECU</th>
                    <th className="px-3 py-3 font-bold">Solicitud</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                    <th className="px-3 py-3 font-bold">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const progress = ESTADO_STAGE[job.estado || 'pendiente'] ?? 5
                    return (
                      <tr key={job.id} onClick={() => setSelectedId(job.id)} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === job.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}>
                        <td className="px-5 py-3 text-zinc-500">{job.created_at ? new Date(job.created_at).toLocaleDateString('es-ES') : '—'}</td>
                        <td className="px-3 py-3 font-bold text-white">{job.taller || '—'}</td>
                        <td className="px-3 py-3 text-zinc-400">{[job.marca, job.modelo].filter(Boolean).join(' ')} {job.ecu ? `/ ${job.ecu}` : ''}</td>
                        <td className="px-3 py-3 text-zinc-300">{job.servicio}</td>
                        <td className="px-3 py-3"><LabBadge status={job.estado}>{(job.estado || 'pendiente').replace('_', ' ')}</LabBadge></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[#c81f2a]" style={{ width: `${progress}%` }} /></div>
                            <span className="text-[11px] font-bold text-zinc-500">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && jobs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-zinc-600">Sin solicitudes todavía.</td></tr>}
                </tbody>
              </table>
            </div>
          </LabPanel>

          <LabPanel
            title="Detalle de la solicitud"
            action={selected && (
              <div className="flex gap-1">
                <button onClick={() => { setEditing(selected); setOpen(true) }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><Pencil size={14} /></button>
                <button onClick={() => setPendingDelete(selected)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            )}
          >
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona una solicitud de la cola.</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Cliente</span><span className="font-bold text-zinc-200">{selected.taller || '—'}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Vehículo</span><span className="font-bold text-zinc-200">{[selected.marca, selected.modelo, selected.motor].filter(Boolean).join(' ') || '—'}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">ECU</span><span className="font-bold text-zinc-200">{selected.ecu || '—'}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">HW / SW</span><span className="font-bold text-zinc-200">{selected.hw || '—'} / {selected.sw || '—'}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Solicitud</span><span className="font-bold text-zinc-200">{selected.servicio}</span></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Estado</span><LabBadge status={selected.estado}>{selected.estado || 'pendiente'}</LabBadge></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><span className="text-zinc-600">Precio</span><span className="font-bold text-zinc-200">{money(selected.precio)} {selected.pagado && <span className="text-[#4ade95]">· Pagado</span>}</span></div>
                <div className="flex justify-between pb-1"><span className="text-zinc-600">Fecha de entrega</span><span className="font-bold text-zinc-200">{selected.updated_at ? new Date(selected.updated_at).toLocaleString('es-ES') : '—'}</span></div>

                {selected.notas && (
                  <div className="pt-1">
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Notas</div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-zinc-400">{selected.notas}</div>
                  </div>
                )}
              </div>
            )}
          </LabPanel>
        </div>
      </div>

      <FileServiceModal open={open} job={editing} onClose={() => setOpen(false)} onSubmit={saveJob} />
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Eliminar solicitud de ${pendingDelete?.taller || 'File Service'}`}
        description="Se eliminará la solicitud histórica definitivamente."
        confirmLabel="Sí, eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </LabShell>
  )
}
