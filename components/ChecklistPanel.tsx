'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Wand2 } from 'lucide-react'
import { ChecklistService } from '@/lib/services/checklist'
import type { ChecklistItem } from '@/types/autokeys'

type Props = {
  expedienteId: string
  suggestedItems: string[]
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

export default function ChecklistPanel({ expedienteId, suggestedItems, onEvent }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await ChecklistService.getByExpediente(expedienteId))
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el checklist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [expedienteId])

  const progress = useMemo(() => {
    if (!items.length) return 0
    return Math.round((items.filter(i => i.completado).length / items.length) * 100)
  }, [items])

  async function createSuggested() {
    setSaving(true); setError('')
    try {
      await ChecklistService.createMany(expedienteId, suggestedItems)
      await onEvent?.('Checklist creado', `${suggestedItems.length} puntos añadidos automáticamente`)
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo crear el checklist') }
    finally { setSaving(false) }
  }

  async function toggle(item: ChecklistItem) {
    setSaving(true); setError('')
    try {
      const next = !item.completado
      await ChecklistService.toggle(item.id, next)
      await onEvent?.(`Checklist: ${item.titulo}`, next ? 'Marcado como completado' : 'Marcado como pendiente')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo actualizar') }
    finally { setSaving(false) }
  }

  async function addCustom() {
    const clean = newItem.trim()
    if (!clean) return
    setSaving(true); setError('')
    try {
      await ChecklistService.add(expedienteId, clean, items.length + 1)
      await onEvent?.('Checklist personalizado', clean)
      setNewItem('')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo añadir') }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    setSaving(true); setError('')
    try {
      await ChecklistService.remove(id)
      await onEvent?.('Checklist actualizado', 'Punto eliminado')
      await load()
    } catch (err: any) { setError(err.message || 'No se pudo eliminar') }
    finally { setSaving(false) }
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-6">
        <div>
          <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><CheckCircle2 className="text-red-300" /> Checklist inteligente</h3>
          <p className="text-zinc-500">Checklist persistente de la OT. Todo queda guardado y registrado en el historial.</p>
        </div>
        <div className="min-w-[220px] rounded-2xl bg-[#0B1220] border border-white/10 p-4">
          <div className="flex items-center justify-between text-sm mb-2"><span className="text-zinc-400 font-bold">Progreso</span><span className="font-black">{progress}%</span></div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 mb-4">{error}</div>}
      {loading && <div className="text-zinc-500">Cargando checklist...</div>}

      {!loading && !items.length && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#0B1220] p-8 text-center">
          <Wand2 className="mx-auto text-red-300 mb-3" size={34} />
          <h4 className="text-xl font-black mb-2">No hay checklist todavía</h4>
          <p className="text-zinc-500 mb-5">Crea automáticamente una plantilla según el tipo de trabajo.</p>
          <button disabled={saving} onClick={createSuggested} className="btn btn-red">Crear checklist sugerido</button>
        </div>
      )}

      {!!items.length && (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className={`rounded-2xl border p-4 transition ${item.completado ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-[#0B1220]'}`}>
              <div className="flex items-center gap-3">
                <button disabled={saving} onClick={() => toggle(item)} className="shrink-0">
                  {item.completado ? <CheckCircle2 className="text-emerald-300" /> : <Circle className="text-zinc-500" />}
                </button>
                <div className="flex-1">
                  <p className={`font-black ${item.completado ? 'text-emerald-200 line-through decoration-emerald-300/60' : 'text-white'}`}>{item.titulo}</p>
                  {item.completed_at && <p className="text-xs text-zinc-500 mt-1">Completado: {new Date(item.completed_at).toLocaleString('es-ES')}</p>}
                </div>
                <button disabled={saving} onClick={() => remove(item.id)} className="text-zinc-500 hover:text-red-300"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B1220] p-4 flex flex-col md:flex-row gap-3">
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Añadir punto personalizado..." />
        <button disabled={saving || !newItem.trim()} onClick={addCustom} className="btn btn-dark inline-flex items-center gap-2"><Plus size={18} /> Añadir</button>
      </div>
    </div>
  )
}
