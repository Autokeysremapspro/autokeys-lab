'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Bell, CheckCircle2, ClipboardCheck, RefreshCw, Save, Search } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Pedido = {
  id: string
  numero?: string | null
  user_id?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  ecu?: string | null
}

type Version = {
  id: string
  pedido_id: string
  numero_version: number
  nombre_archivo?: string | null
  nota_cliente?: string | null
  nota_interna?: string | null
  tipo_revision?: string | null
  instrucciones_entrega?: string | null
  checklist?: unknown
  notificar_cliente?: boolean | null
  notificacion_enviada_at?: string | null
  created_at?: string | null
}

type Row = Version & { pedido?: Pedido }

const tipos = [
  { value: 'entrega', label: 'Entrega' },
  { value: 'revision', label: 'Revisión' },
  { value: 'correccion', label: 'Corrección' },
  { value: 'prueba', label: 'Prueba' },
]

function checklistToText(value: unknown) {
  if (!value) return ''
  if (Array.isArray(value)) return value.map(String).join('\n')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, checked]) => Boolean(checked))
      .map(([item]) => item)
      .join('\n')
  }
  return String(value)
}

function textToChecklist(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function AkCloudRevisionesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [drafts, setDrafts] = useState<Record<string, { tipo: string; instrucciones: string; checklist: string; notificar: boolean }>>({})

  async function load() {
    setLoading(true)
    try {
      const [{ data: versiones, error: versionError }, { data: pedidos, error: pedidoError }] = await Promise.all([
        supabase.from('file_service_versiones').select('*').order('created_at', { ascending: false }),
        supabase.from('file_service_pedidos').select('id,numero,user_id,cliente_nombre,cliente_email,marca,modelo,motor,ecu'),
      ])
      if (versionError) throw versionError
      if (pedidoError) throw pedidoError

      const pedidosById = new Map((pedidos || []).map((pedido: Pedido) => [pedido.id, pedido]))
      const joined = ((versiones || []) as Version[]).map((version) => ({ ...version, pedido: pedidosById.get(version.pedido_id) }))
      setRows(joined)
      setDrafts(Object.fromEntries(joined.map((version) => [version.id, {
        tipo: version.tipo_revision || 'entrega',
        instrucciones: version.instrucciones_entrega || '',
        checklist: checklistToText(version.checklist),
        notificar: Boolean(version.notificar_cliente),
      }])))
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las revisiones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => [
      row.pedido?.numero,
      row.pedido?.cliente_nombre,
      row.pedido?.cliente_email,
      row.pedido?.marca,
      row.pedido?.modelo,
      row.pedido?.motor,
      row.pedido?.ecu,
      row.nombre_archivo,
      row.tipo_revision,
    ].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [rows, query])

  function patchDraft(id: string, patch: Partial<{ tipo: string; instrucciones: string; checklist: string; notificar: boolean }>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  async function save(row: Row) {
    const draft = drafts[row.id]
    if (!draft) return
    setWorking(row.id)
    try {
      const checklist = textToChecklist(draft.checklist)
      const now = new Date().toISOString()
      let sentAt = row.notificacion_enviada_at || null

      const { error: updateError } = await supabase
        .from('file_service_versiones')
        .update({
          tipo_revision: draft.tipo,
          instrucciones_entrega: draft.instrucciones.trim() || null,
          checklist,
          notificar_cliente: draft.notificar,
        })
        .eq('id', row.id)
      if (updateError) throw updateError

      if (draft.notificar && !row.notificacion_enviada_at && row.pedido?.user_id) {
        const versionLabel = `V${row.numero_version}`
        const tipoLabel = tipos.find((item) => item.value === draft.tipo)?.label || 'Actualización'
        const detalles = [
          `${tipoLabel} ${versionLabel} disponible para el pedido ${row.pedido.numero || row.pedido_id}.`,
          draft.instrucciones.trim() || null,
          checklist.length ? `Checklist: ${checklist.join(' · ')}` : null,
        ].filter(Boolean).join('\n')

        const { error: notifyError } = await supabase.from('file_service_notificaciones').insert({
          user_id: row.pedido.user_id,
          pedido_id: row.pedido_id,
          titulo: `${tipoLabel} ${versionLabel} — instrucciones técnicas`,
          mensaje: detalles,
          tipo: 'info',
        })
        if (notifyError) throw notifyError

        const { error: messageError } = await supabase.from('file_service_mensajes').insert({
          pedido_id: row.pedido_id,
          user_id: row.pedido.user_id,
          autor_nombre: 'Autokeys Core',
          autor_tipo: 'admin',
          mensaje: detalles,
        })
        if (messageError) throw messageError

        const { error: sentError } = await supabase
          .from('file_service_versiones')
          .update({ notificacion_enviada_at: now })
          .eq('id', row.id)
        if (sentError) throw sentError
        sentAt = now
      }

      setRows((current) => current.map((item) => item.id === row.id ? {
        ...item,
        tipo_revision: draft.tipo,
        instrucciones_entrega: draft.instrucciones.trim() || null,
        checklist,
        notificar_cliente: draft.notificar,
        notificacion_enviada_at: sentAt,
      } : item))
      toast.success(sentAt && !row.notificacion_enviada_at ? 'Revisión guardada y cliente notificado' : 'Revisión guardada')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar la revisión')
    } finally {
      setWorking(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link href="/ak-cloud" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
              <ArrowLeft size={16}/> Volver a AK Cloud
            </Link>
            <div className="flex items-center gap-3"><ClipboardCheck className="text-[#ff5468]"/><h1 className="text-4xl font-bold">Revisiones y entregas</h1></div>
            <p className="mt-2 text-zinc-500">Versiones estructuradas, instrucciones de entrega, checklist técnico y aviso controlado al distribuidor.</p>
          </div>
          <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCw size={17}/> Actualizar</button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={17} className="text-zinc-500"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pedido, cliente, vehículo, ECU o versión..." className="w-full bg-transparent outline-none"/>
          </div>

          {loading ? <div className="p-8 text-center text-zinc-500">Cargando revisiones...</div> : filtered.length === 0 ? <div className="p-8 text-center text-zinc-500">No hay versiones con esos filtros.</div> : (
            <div className="grid gap-5">
              {filtered.map((row) => {
                const draft = drafts[row.id] || { tipo: 'entrega', instrucciones: '', checklist: '', notificar: false }
                const pedido = row.pedido
                return (
                  <article key={row.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="font-mono text-sm font-bold text-[#ff5468]">{pedido?.numero || 'FS-SIN-NUM'} · V{row.numero_version}</div>
                        <h2 className="mt-2 text-xl font-bold">{[pedido?.marca, pedido?.modelo, pedido?.motor].filter(Boolean).join(' · ') || row.nombre_archivo || 'Versión AK Cloud'}</h2>
                        <p className="mt-1 text-sm text-zinc-500">{pedido?.cliente_nombre || pedido?.cliente_email || 'Distribuidor sin identificar'} · {pedido?.ecu || 'ECU —'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {row.notificacion_enviada_at && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300"><CheckCircle2 size={14}/> Notificado</span>}
                        <Link href={`/ak-cloud/${row.pedido_id}`} className="btn btn-dark text-sm">Abrir pedido</Link>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Tipo</span>
                        <select value={draft.tipo} onChange={(e) => patchDraft(row.id, { tipo: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none">
                          {tipos.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Instrucciones de entrega/prueba</span>
                        <textarea value={draft.instrucciones} onChange={(e) => patchDraft(row.id, { instrucciones: e.target.value })} rows={4} placeholder="Ej.: escribir por BENCH, borrar DTC, arrancar y probar en caliente..." className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"/>
                      </label>
                    </div>

                    <label className="mt-4 block space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Checklist técnico · un punto por línea</span>
                      <textarea value={draft.checklist} onChange={(e) => patchDraft(row.id, { checklist: e.target.value })} rows={4} placeholder={'Checksum verificado\nArchivo correcto para HW/SW\nDTC revisados\nInstrucciones adjuntas'} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"/>
                    </label>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <label className="flex items-center gap-3 text-sm text-zinc-300">
                        <input type="checkbox" checked={draft.notificar} disabled={Boolean(row.notificacion_enviada_at)} onChange={(e) => patchDraft(row.id, { notificar: e.target.checked })}/>
                        <Bell size={16} className="text-[#ff5468]"/>
                        {row.notificacion_enviada_at ? 'Notificación técnica ya enviada' : 'Notificar al cliente al guardar'}
                      </label>
                      <button onClick={() => save(row)} disabled={working === row.id} className="btn btn-red inline-flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16}/> {working === row.id ? 'Guardando...' : 'Guardar revisión'}</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
