'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import CasoTecnicoModal from '@/components/CasoTecnicoModal'
import { CasosTecnicosService } from '@/lib/services/casosTecnicos'
import type { CasoTecnico } from '@/types/autokeys'
import { ArrowLeft, Cpu, Edit, FileArchive, SearchCheck, Star, Wrench } from 'lucide-react'

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-ES')
}

export default function CasoTecnicoFichaPage() {
  const params = useParams()
  const id = String(params.id)
  const [caso, setCaso] = useState<CasoTecnico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setCaso(await CasosTecnicosService.getById(id))
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el caso técnico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function save(payload: Partial<CasoTecnico>) {
    await CasosTecnicosService.update(id, payload)
    await load()
  }

  if (loading) return <AppShell><div className="card p-8 text-zinc-400">Cargando caso técnico...</div></AppShell>
  if (error) return <AppShell><div className="card p-8 text-red-300">{error}</div></AppShell>
  if (!caso) return <AppShell><div className="card p-8 text-red-300">Caso técnico no encontrado.</div></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/biblioteca" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white"><ArrowLeft size={18} /> Volver a biblioteca</Link>

        <div className="card p-6">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-red-400 font-black uppercase tracking-[0.2em]">Caso técnico</p>
                {caso.destacado && <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300"><Star size={14} className="fill-yellow-300" /> Destacado</span>}
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300 uppercase">{(caso.categoria || 'caso').replaceAll('_', ' ')}</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-black mt-2">{caso.titulo}</h1>
              <p className="text-zinc-400 mt-2 text-lg">{[caso.marca, caso.modelo, caso.motor].filter(Boolean).join(' · ') || 'Vehículo sin definir'}</p>
              <p className="text-zinc-600 mt-2 text-sm">Actualizado: {formatDate(caso.updated_at || caso.created_at)}</p>
            </div>
            <button onClick={() => setOpen(true)} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 inline-flex items-center gap-2"><Edit size={18} /> Editar caso</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <Info label="Matrícula" value={caso.matricula || '—'} />
          <Info label="VIN" value={caso.bastidor || '—'} />
          <Info label="ECU" value={caso.ecu || '—'} />
          <Info label="DTC" value={caso.dtc || '—'} />
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          <section className="card p-6 xl:col-span-2 space-y-5">
            <Block icon={<SearchCheck className="text-red-300" />} title="Síntomas" text={caso.sintomas} />
            <Block icon={<Cpu className="text-red-300" />} title="Diagnóstico" text={caso.diagnostico} />
            <Block icon={<Wrench className="text-red-300" />} title="Solución aplicada" text={caso.solucion} />
          </section>

          <aside className="space-y-5">
            <div className="card p-6">
              <h3 className="text-2xl font-black mb-4">Datos ECU</h3>
              <div className="space-y-3">
                <Mini label="ECU" value={caso.ecu || '—'} />
                <Mini label="HW" value={caso.hw || '—'} />
                <Mini label="SW" value={caso.sw || '—'} />
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-2xl font-black mb-4 flex items-center gap-2"><FileArchive className="text-red-300" /> Archivos</h3>
              <p className="text-zinc-400 whitespace-pre-wrap">{caso.archivos_resumen || 'Sin resumen de archivos.'}</p>
            </div>
            <div className="card p-6">
              <h3 className="text-2xl font-black mb-4">Herramientas</h3>
              <p className="text-zinc-400 whitespace-pre-wrap">{caso.herramientas || 'Sin herramientas registradas.'}</p>
            </div>
          </aside>
        </div>

        {!!caso.tags?.length && (
          <div className="card p-6">
            <h3 className="text-xl font-black mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {caso.tags.map(tag => <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">#{tag}</span>)}
            </div>
          </div>
        )}
      </div>

      <CasoTecnicoModal open={open} caso={caso} onClose={() => setOpen(false)} onSubmit={save} />
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5"><div className="text-xs uppercase tracking-[0.16em] text-zinc-500 font-black">{label}</div><div className="text-xl font-black mt-2 break-all">{value}</div></div>
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/5 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-black">{label}</div><div className="font-bold break-all mt-1">{value}</div></div>
}

function Block({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string | null }) {
  return <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-5"><h3 className="text-2xl font-black mb-3 flex items-center gap-2">{icon} {title}</h3><p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{text || 'Sin información registrada.'}</p></div>
}
