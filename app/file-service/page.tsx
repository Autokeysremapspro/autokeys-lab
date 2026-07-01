'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import FileServiceModal from '@/components/FileServiceModal'
import type { FileServiceJob } from '@/types/autokeys'
import {
  createFileServiceJob,
  deleteFileServiceJob,
  filterFileServiceJobs,
  getFileServiceJobs,
  updateFileServiceJob,
} from '@/lib/services/fileService'
import { Edit, Plus, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react'

const statusClass: Record<string, string> = {
  pendiente: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  en_proceso: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  enviado: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  revision: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  finalizado: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelado: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
}

export default function FileServicePage() {
  const [jobs, setJobs] = useState<FileServiceJob[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FileServiceJob | null>(null)

  async function loadJobs() {
    setLoading(true)
    setError(null)
    try {
      const rows = await getFileServiceJobs()
      setJobs(rows)
    } catch (err: any) {
      setError(err?.message || 'Error cargando File Service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const filtered = useMemo(() => filterFileServiceJobs(jobs, query), [jobs, query])

  const stats = useMemo(() => {
    const abiertos = jobs.filter((j) => !['finalizado', 'cancelado'].includes(j.estado || '')).length
    const pendientes = jobs.filter((j) => j.estado === 'pendiente').length
    const finalizados = jobs.filter((j) => j.estado === 'finalizado').length
    const facturado = jobs.reduce((sum, j) => sum + Number(j.precio || 0), 0)
    return { abiertos, pendientes, finalizados, facturado }
  }, [jobs])

  async function saveJob(payload: Partial<FileServiceJob>) {
    if (editing?.id) {
      await updateFileServiceJob(editing.id, payload)
    } else {
      await createFileServiceJob(payload)
    }
    await loadJobs()
  }

  async function removeJob(job: FileServiceJob) {
    if (!confirm(`¿Eliminar solicitud de ${job.taller || 'File Service'}?`)) return
    await deleteFileServiceJob(job.id)
    await loadJobs()
  }

  function openNew() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(job: FileServiceJob) {
    setEditing(job)
    setOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 font-black tracking-[0.22em] uppercase">Autokeys Core</p>
            <h1 className="text-4xl font-black mt-1">File Service</h1>
            <p className="text-zinc-500 mt-2">Control de archivos de distribuidores, talleres y trabajos externos.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadJobs} className="rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/5 flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
            <button onClick={openNew} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 flex items-center gap-2">
              <Plus size={18} /> Nueva solicitud
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Abiertos" value={stats.abiertos} />
          <Stat label="Pendientes" value={stats.pendientes} />
          <Stat label="Finalizados" value={stats.finalizados} />
          <Stat label="Importe total" value={`${stats.facturado.toFixed(2)} €`} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 mb-5">
            <Search size={18} className="text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por taller, matrícula, ECU, HW, SW, servicio..." className="w-full bg-transparent outline-none" />
          </div>

          {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-4">{error}</div>}
          {loading && <div className="text-zinc-500 p-6">Cargando solicitudes...</div>}

          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
              <UploadCloud className="mx-auto text-zinc-600 mb-3" size={42} />
              <h3 className="text-xl font-black">No hay solicitudes</h3>
              <p className="text-zinc-500 mt-2">Crea la primera solicitud de File Service.</p>
              <button onClick={openNew} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 mt-5">Crear solicitud</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map((job) => (
              <article key={job.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5 hover:border-red-500/40 transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black">{job.taller || 'Sin taller'}</h3>
                      <span className={`text-xs rounded-full border px-3 py-1 font-black uppercase ${statusClass[job.estado || 'pendiente'] || statusClass.pendiente}`}>
                        {(job.estado || 'pendiente').replace('_', ' ')}
                      </span>
                      {job.pagado && <span className="text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-black text-emerald-300">Pagado</span>}
                    </div>
                    <p className="text-zinc-500 mt-1">{[job.marca, job.modelo, job.motor].filter(Boolean).join(' · ') || 'Vehículo sin definir'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{Number(job.precio || 0).toFixed(2)} €</div>
                    <div className="text-xs text-zinc-500">{job.created_at ? new Date(job.created_at).toLocaleDateString('es-ES') : ''}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <Mini label="Matrícula" value={job.matricula || '—'} />
                  <Mini label="ECU" value={job.ecu || '—'} />
                  <Mini label="HW" value={job.hw || '—'} />
                  <Mini label="SW" value={job.sw || '—'} />
                </div>

                <div className="mt-4 rounded-2xl bg-black/20 border border-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-black mb-1">Servicio</div>
                  <div className="font-black text-red-300">{job.servicio || 'Sin definir'}</div>
                  {job.notas && <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{job.notas}</p>}
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => openEdit(job)} className="rounded-2xl border border-white/10 px-4 py-2 font-bold hover:bg-white/5 flex items-center gap-2">
                    <Edit size={16} /> Editar
                  </button>
                  <button onClick={() => removeJob(job)} className="rounded-2xl border border-red-500/30 px-4 py-2 font-bold text-red-300 hover:bg-red-500/10 flex items-center gap-2">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <FileServiceModal
        open={open}
        job={editing}
        onClose={() => setOpen(false)}
        onSubmit={saveJob}
      />
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
      <div className="text-sm text-zinc-500 font-bold">{label}</div>
      <div className="text-3xl font-black mt-2">{value}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-black">{label}</div>
      <div className="font-bold truncate mt-1">{value}</div>
    </div>
  )
}
