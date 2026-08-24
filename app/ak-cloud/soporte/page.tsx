'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { RefreshCw, Send } from 'lucide-react'

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

function estadoTone(estado?: string | null): 'green' | 'amber' | 'zinc' | 'blue' {
  switch (estado) {
    case 'respondido': return 'green'
    case 'en_revision': return 'amber'
    case 'cerrado': return 'zinc'
    default: return 'blue'
  }
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export default function AkCloudSoportePage() {
  return (
    <Suspense fallback={null}>
      <AkCloudSoporteContent />
    </Suspense>
  )
}

function AkCloudSoporteContent() {
  const searchParams = useSearchParams()
  const ticketParam = searchParams.get('ticket')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  // Un enlace directo a un ticket (desde una notificación) puede apuntar a
  // uno que no esté "abierto" (p. ej. ya respondido) — con estado inicial
  // 'todos' nos aseguramos de que aparezca en la lista cargada.
  const [estado, setEstado] = useState(ticketParam ? 'todos' : 'abierto')
  const [activeId, setActiveId] = useState<string | null>(ticketParam)
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
    <LabShell
      title="Soporte AK Cloud"
      subtitle="Responde tickets de AK Cloud desde Autokeys Lab. El distribuidor recibe la notificación al instante."
      actions={
        <button onClick={loadTickets} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-white/[0.08]">
          <RefreshCw size={15} /> Actualizar
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['abierto', 'en_revision', 'respondido', 'cerrado', 'todos'].map((item) => (
            <button
              key={item}
              onClick={() => setEstado(item)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${estado === item ? 'bg-[#c81f2a] text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <LabPanel padded={false}>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-6 text-sm text-zinc-500">Cargando tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-6 text-sm text-zinc-500">No hay tickets en este estado.</div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={`block w-full p-4 text-left transition hover:bg-white/[0.04] ${activeId === t.id ? 'bg-white/[0.06]' : ''}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <LabBadge tone={estadoTone(t.estado)}>{t.estado || 'abierto'}</LabBadge>
                      <span className="text-[11px] text-zinc-500">{formatDate(t.created_at)}</span>
                    </div>
                    <p className="truncate text-sm font-bold text-white">{t.asunto}</p>
                    <p className="truncate text-xs text-zinc-500">{t.numero} · {t.categoria || 'General'}</p>
                  </button>
                ))
              )}
            </div>
          </LabPanel>

          <LabPanel>
            {!activeTicket ? (
              <div className="flex h-full items-center justify-center py-10 text-sm text-zinc-500">Selecciona un ticket para ver la conversación.</div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="mb-4 border-b border-white/[0.07] pb-4">
                  <h3 className="text-lg font-bold text-white">{activeTicket.asunto}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{activeTicket.numero} · {activeTicket.descripcion || 'Sin descripción adicional'}</p>
                </div>
                <div className="mb-4 max-h-[50vh] flex-1 space-y-3 overflow-y-auto">
                  {mensajes.map((m) => (
                    <div key={m.id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.interno ? 'ml-auto bg-[#c81f2a]/15 text-[#ff5468]' : 'bg-white/[0.05] text-zinc-200'}`}>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">{m.remitente || 'Distribuidor'} · {formatDate(m.created_at)}</p>
                      {m.mensaje}
                    </div>
                  ))}
                  {mensajes.length === 0 && <p className="text-sm text-zinc-500">Todavía no hay mensajes en este ticket.</p>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none"
                  />
                  <div className="flex gap-2">
                    <button disabled={working} onClick={() => enviarRespuesta(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c81f2a] px-4 py-3 text-sm font-bold text-white hover:bg-[#e2242f] disabled:opacity-50 sm:flex-none">
                      <Send size={15} /> Enviar
                    </button>
                    <button disabled={working} onClick={() => enviarRespuesta(true)} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50 sm:flex-none">
                      Cerrar ticket
                    </button>
                  </div>
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}
