'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { ArrowLeft, Headphones, RefreshCw, Send } from 'lucide-react'

type Ticket = {
  id: string
  numero: string
  asunto: string
  categoria?: string | null
  prioridad?: string | null
  estado?: string | null
  descripcion?: string | null
  created_at?: string | null
}

type Mensaje = {
  id: string
  remitente?: string | null
  mensaje: string
  interno?: boolean | null
  created_at?: string | null
}

function estadoClass(estado?: string | null) {
  switch (estado) {
    case 'respondido': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'en_revision': return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    case 'cerrado': return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
    default: return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  }
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default function AkCloudSoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('abierto')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [respuesta, setRespuesta] = useState('')
  const [working, setWorking] = useState(false)

  async function loadTickets() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ak-cloud/soporte?estado=${estado}`)
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      setTickets(payload.tickets || [])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar los tickets')
    } finally {
      setLoading(false)
    }
  }

  async function loadMensajes(ticketId: string) {
    try {
      const res = await fetch(`/api/ak-cloud/soporte?ticket_id=${ticketId}`)
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      setMensajes(payload.mensajes || [])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar la conversación')
    }
  }

  useEffect(() => {
    loadTickets()
  }, [estado])

  useEffect(() => {
    if (activeId) loadMensajes(activeId)
  }, [activeId])

  const activeTicket = useMemo(() => tickets.find((t) => t.id === activeId) || null, [tickets, activeId])

  async function enviarRespuesta(cerrar?: boolean) {
    if (!activeId || (!respuesta.trim() && !cerrar)) return
    setWorking(true)
    try {
      const res = await fetch('/api/ak-cloud/soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: activeId,
          mensaje: respuesta.trim() || undefined,
          estado: cerrar ? 'cerrado' : respuesta.trim() ? 'respondido' : undefined,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error)
      toast.success(cerrar ? 'Ticket cerrado' : 'Respuesta enviada')
      setRespuesta('')
      await Promise.all([loadTickets(), loadMensajes(activeId)])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar la respuesta')
    } finally {
      setWorking(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#101827] to-[#19070d] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/ak-cloud" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
                <ArrowLeft size={16} /> Volver a AK Cloud
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Headphones size={16} /> AK Cloud Sync
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Soporte de distribuidores</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">Responde tickets de AK Cloud desde Autokeys Core. El distribuidor recibe la notificación al instante.</p>
            </div>
            <button onClick={loadTickets} className="btn btn-dark inline-flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          {['abierto', 'en_revision', 'respondido', 'cerrado', 'todos'].map((item) => (
            <button
              key={item}
              onClick={() => setEstado(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-wider transition ${estado === item ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              {item}
            </button>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div className="card divide-y divide-white/5 p-0">
            {loading ? (
              <div className="p-6 text-zinc-500">Cargando tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-zinc-500">No hay tickets en este estado.</div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`block w-full p-4 text-left transition hover:bg-white/[0.04] ${activeId === t.id ? 'bg-white/[0.06]' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${estadoClass(t.estado)}`}>{t.estado || 'abierto'}</span>
                    <span className="text-[11px] text-zinc-500">{formatDate(t.created_at)}</span>
                  </div>
                  <p className="truncate font-bold text-white">{t.asunto}</p>
                  <p className="truncate text-xs text-zinc-500">{t.numero} · {t.categoria || 'General'}</p>
                </button>
              ))
            )}
          </div>

          <div className="card p-5">
            {!activeTicket ? (
              <div className="flex h-full items-center justify-center text-zinc-500">Selecciona un ticket para ver la conversación.</div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="mb-4 border-b border-white/10 pb-4">
                  <h3 className="text-xl font-black">{activeTicket.asunto}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{activeTicket.numero} · {activeTicket.descripcion || 'Sin descripción adicional'}</p>
                </div>
                <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
                  {mensajes.map((m) => (
                    <div key={m.id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.interno ? 'ml-auto bg-red-600/15 text-red-100' : 'bg-white/[0.05] text-zinc-200'}`}>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-zinc-500">{m.remitente || 'Distribuidor'} · {formatDate(m.created_at)}</p>
                      {m.mensaje}
                    </div>
                  ))}
                  {mensajes.length === 0 && <p className="text-zinc-500">Todavía no hay mensajes en este ticket.</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none"
                  />
                  <button disabled={working} onClick={() => enviarRespuesta(false)} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
                    <Send size={16} /> Enviar
                  </button>
                  <button disabled={working} onClick={() => enviarRespuesta(true)} className="btn btn-dark disabled:opacity-50">
                    Cerrar ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
