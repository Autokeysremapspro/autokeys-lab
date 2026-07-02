'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import CasoTecnicoModal from '@/components/CasoTecnicoModal'
import { CasosTecnicosService, filterCasos } from '@/lib/services/casosTecnicos'
import type { CasoTecnico } from '@/types/autokeys'
import { BookOpen, Edit, Plus, RefreshCw, Search, Star, Trash2, Wrench } from 'lucide-react'

const categorias = ['todos', 'averia', 'clonacion_ecu', 'immo', 'llaves', 'reprogramacion', 'cuadro', 'airbag', 'bsi_bcm', 'fem_bdc', 'egr_dpf_adblue', 'otro']

function date(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-ES')
}

export default function BibliotecaTecnicaPage() {
  const [casos, setCasos] = useState<CasoTecnico[]>([])
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CasoTecnico | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setCasos(await CasosTecnicosService.getAll())
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la biblioteca técnica')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => filterCasos(casos, query, categoria), [casos, query, categoria])
  const stats = useMemo(() => {
    const destacados = casos.filter(c => c.destacado).length
    const ecu = casos.filter(c => ['clonacion_ecu', 'immo', 'reprogramacion', 'egr_dpf_adblue'].includes(c.categoria || '')).length
    const llaves = casos.filter(c => ['llaves', 'fem_bdc'].includes(c.categoria || '')).length
    return { total: casos.length, destacados, ecu, llaves }
  }, [casos])

  function nuevo() {
    setEditing(null)
    setOpen(true)
  }

  function editar(caso: CasoTecnico) {
    setEditing(caso)
    setOpen(true)
  }

  async function guardar(payload: Partial<CasoTecnico>) {
    if (editing?.id) await CasosTecnicosService.update(editing.id, payload)
    else await CasosTecnicosService.create(payload)
    await load()
  }

  async function eliminar(caso: CasoTecnico) {
    if (!confirm(`¿Eliminar caso técnico "${caso.titulo}"?`)) return
    await CasosTecnicosService.remove(caso.id)
    await load()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 font-black tracking-[0.22em] uppercase">Conocimiento del laboratorio</p>
            <h1 className="text-4xl font-black mt-1">Biblioteca Técnica</h1>
            <p className="text-zinc-500 mt-2">Casos resueltos, averías repetidas, soluciones, ECUs, DTC, archivos y notas técnicas.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/5 flex items-center gap-2"><RefreshCw size={18} /> Actualizar</button>
            <button onClick={nuevo} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 flex items-center gap-2"><Plus size={18} /> Nuevo caso</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Casos" value={stats.total} />
          <Stat label="Destacados" value={stats.destacados} />
          <Stat label="ECU / IMMO" value={stats.ecu} />
          <Stat label="Llaves / FEM" value={stats.llaves} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5">
          <div className="grid xl:grid-cols-[1fr_280px] gap-3 mb-5">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3">
              <Search size={18} className="text-zinc-500" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por síntoma, ECU, DTC, HW, SW, matrícula, solución..." className="w-full bg-transparent outline-none" />
            </div>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3">
              {categorias.map(c => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}
            </select>
          </div>

          {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-4">{error}</div>}
          {loading && <div className="text-zinc-500 p-6">Cargando biblioteca técnica...</div>}

          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
              <BookOpen className="mx-auto text-zinc-600 mb-3" size={42} />
              <h3 className="text-xl font-black">No hay casos técnicos</h3>
              <p className="text-zinc-500 mt-2">Guarda la primera avería o solución para empezar tu base de conocimiento.</p>
              <button onClick={nuevo} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 mt-5">Crear caso</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map(caso => (
              <article key={caso.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5 hover:border-red-500/40 transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {caso.destacado && <Star size={18} className="text-yellow-300 fill-yellow-300" />}
                      <h3 className="text-xl font-black">{caso.titulo}</h3>
                    </div>
                    <p className="text-zinc-500 mt-1">{[caso.marca, caso.modelo, caso.motor].filter(Boolean).join(' · ') || 'Vehículo sin definir'}</p>
                  </div>
                  <span className="text-xs rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-black text-red-300 uppercase">{(caso.categoria || 'caso').replaceAll('_', ' ')}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <Mini label="ECU" value={caso.ecu || '—'} />
                  <Mini label="HW" value={caso.hw || '—'} />
                  <Mini label="SW" value={caso.sw || '—'} />
                  <Mini label="DTC" value={caso.dtc || '—'} />
                </div>

                <div className="mt-4 rounded-2xl bg-black/20 border border-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-black mb-1">Solución</div>
                  <p className="text-sm text-zinc-300 line-clamp-3">{caso.solucion || caso.diagnostico || caso.sintomas || 'Sin descripción todavía.'}</p>
                </div>

                {!!caso.tags?.length && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {caso.tags.slice(0, 6).map(tag => <span key={tag} className="text-xs rounded-full border border-white/10 px-3 py-1 text-zinc-400">#{tag}</span>)}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <div className="text-xs text-zinc-500">Creado: {date(caso.created_at)}</div>
                  <div className="flex gap-2">
                    <Link href={`/biblioteca/${caso.id}`} className="rounded-2xl border border-white/10 px-4 py-2 font-bold hover:bg-white/5 flex items-center gap-2"><Wrench size={16} /> Abrir</Link>
                    <button onClick={() => editar(caso)} className="rounded-2xl border border-white/10 px-4 py-2 font-bold hover:bg-white/5 flex items-center gap-2"><Edit size={16} /> Editar</button>
                    <button onClick={() => eliminar(caso)} className="rounded-2xl border border-red-500/30 px-4 py-2 font-bold text-red-300 hover:bg-red-500/10 flex items-center gap-2"><Trash2 size={16} /> Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <CasoTecnicoModal open={open} caso={editing} onClose={() => setOpen(false)} onSubmit={guardar} />
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5"><div className="text-sm text-zinc-500 font-bold">{label}</div><div className="text-3xl font-black mt-2">{value}</div></div>
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-black">{label}</div><div className="font-bold truncate mt-1">{value}</div></div>
}
