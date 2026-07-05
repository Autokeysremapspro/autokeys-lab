'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { BookOpen, Edit3, Plus, Search, Star, Trash2, Trophy } from 'lucide-react'
import AppShell from '@/components/AppShell'
import BibliotecaCasoModal from '@/components/BibliotecaCasoModal'
import { actualizarCasoTecnico, crearCasoTecnico, eliminarCasoTecnico, getCasosTecnicos } from '@/lib/services/bibliotecaTecnica'
import type { BibliotecaPayload, BibliotecaTecnica } from '@/types/biblioteca'

export default function BibliotecaTecnicaPage() {
  const [casos, setCasos] = useState<BibliotecaTecnica[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BibliotecaTecnica | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      setCasos(await getCasosTecnicos())
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar la biblioteca')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return casos
    return casos.filter((caso) =>
      [
        caso.titulo,
        caso.marca,
        caso.modelo,
        caso.motor,
        caso.ecu,
        caso.hardware,
        caso.software,
        caso.tipo_trabajo,
        caso.herramienta,
        caso.sintomas,
        caso.solucion,
        ...(caso.tags || []),
      ].some((value) => (value || '').toLowerCase().includes(q))
    )
  }, [casos, query])

  const destacados = casos.filter((c) => c.destacado).length
  const definitivas = casos.filter((c) => c.solucion_definitiva).length
  const conEcu = casos.filter((c) => c.ecu).length

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(caso: BibliotecaTecnica) {
    setEditing(caso)
    setModalOpen(true)
  }

  async function save(payload: BibliotecaPayload) {
    setSaving(true)
    try {
      if (editing) await actualizarCasoTecnico(editing.id, payload)
      else await crearCasoTecnico(payload)
      toast.success(editing ? 'Caso actualizado' : 'Caso creado')
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar el caso')
    } finally {
      setSaving(false)
    }
  }

  async function remove(caso: BibliotecaTecnica) {
    if (!confirm(`¿Eliminar el caso técnico "${caso.titulo}"?`)) return
    try {
      await eliminarCasoTecnico(caso.id)
      toast.success('Caso eliminado')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar')
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <BookOpen size={14} /> Biblioteca Técnica PRO
          </div>
          <h2 className="text-3xl font-black tracking-tight">Biblioteca técnica</h2>
          <p className="mt-1 text-zinc-500">Casos resueltos, ECUs, HW/SW, síntomas y soluciones del laboratorio.</p>
        </div>
        <button onClick={openCreate} className="btn btn-red inline-flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo caso
        </button>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_180px_180px_180px]">
        <div className="card flex items-center gap-3 p-4">
          <Search className="text-zinc-500" size={20} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por ECU, HW, SW, síntoma, solución, herramienta..." className="w-full border-0 bg-transparent p-0" />
        </div>
        <Stat label="Casos" value={casos.length} />
        <Stat label="Con ECU" value={conEcu} />
        <Stat label="Destacados" value={destacados + definitivas} />
      </div>

      {loading ? (
        <div className="card p-8 text-zinc-500">Cargando biblioteca...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-zinc-500">No hay casos que coincidan con la búsqueda.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((caso) => (
            <div key={caso.id} className="card p-5 transition hover:-translate-y-0.5 hover:border-red-500/35">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-400">
                    {caso.ecu || 'ECU —'}
                    {caso.destacado && <Star size={14} className="text-yellow-400" />}
                    {caso.solucion_definitiva && <Trophy size={14} className="text-emerald-400" />}
                  </div>
                  <h3 className="mt-2 text-xl font-black">{caso.titulo}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{[caso.marca, caso.modelo, caso.motor].filter(Boolean).join(' · ') || 'Vehículo sin definir'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-black text-zinc-300">D{caso.dificultad || 1}</div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <Info label="HW / SW" value={[caso.hardware, caso.software].filter(Boolean).join(' · ') || '—'} />
                <Info label="Trabajo / herramienta" value={[caso.tipo_trabajo, caso.herramienta].filter(Boolean).join(' · ') || '—'} />
                <Info label="Solución" value={caso.solucion || 'Sin solución registrada'} />
              </div>

              {!!caso.tags?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {caso.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-400">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => openEdit(caso)} className="btn btn-dark inline-flex items-center gap-2 text-sm"><Edit3 size={15} /> Editar</button>
                <button onClick={() => remove(caso)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300"><Trash2 size={15} /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BibliotecaCasoModal open={modalOpen} caso={editing} loading={saving} onClose={() => { setModalOpen(false); setEditing(null) }} onSubmit={save} />
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-black/20 p-3"><div className="text-zinc-500">{label}</div><div className="mt-1 line-clamp-2 font-bold text-zinc-200">{value}</div></div>
}
