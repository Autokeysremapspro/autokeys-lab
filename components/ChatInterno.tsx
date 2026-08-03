'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, Wrench, Building2, Users, X } from 'lucide-react'
import {
  getMensajes,
  getPerfilActual,
  enviarMensaje,
  suscribirMensajes,
  type CanalChat,
  type MensajeChatInterno,
  type PerfilChat,
} from '@/lib/services/chatInterno'

const CANALES: { slug: CanalChat; label: string; icon: any }[] = [
  { slug: 'general', label: 'General', icon: Users },
  { slug: 'laboratorio', label: 'Laboratorio', icon: Wrench },
  { slug: 'administracion', label: 'Oficina', icon: Building2 },
]

const LAST_SEEN_KEY = 'ak-core-chat-last-seen'

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatInterno() {
  const [open, setOpen] = useState(false)
  const [canal, setCanal] = useState<CanalChat>('general')
  const [perfil, setPerfil] = useState<PerfilChat | null>(null)
  const [mensajes, setMensajes] = useState<MensajeChatInterno[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPerfilActual().then(setPerfil).catch(() => setPerfil(null))
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getMensajes(canal)
      .then((data) => mounted && setMensajes(data))
      .catch(() => mounted && setMensajes([]))
      .finally(() => mounted && setLoading(false))

    const unsubscribe = suscribirMensajes(canal, (nuevo) => {
      setMensajes((current) => [...current, nuevo])
      if (!open) setUnread((n) => n + 1)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, open])

  useEffect(() => {
    if (open) {
      setUnread(0)
      try { window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()) } catch {}
    }
  }, [open, canal])

  async function enviar() {
    if (!perfil || !texto.trim() || sending) return
    setSending(true)
    const contenido = texto.trim()
    setTexto('')
    try {
      await enviarMensaje(canal, contenido, perfil)
    } catch {
      setTexto(contenido)
    } finally {
      setSending(false)
    }
  }

  const canalActivo = useMemo(() => CANALES.find((c) => c.slug === canal)!, [canal])

  return (
    <div className="fixed bottom-5 right-5 z-[200]">
      {open && (
        <div className="mb-3 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0c0f16] shadow-[0_30px_90px_rgba(0,0,0,.55)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#10141c] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e2954d]/15 text-[#ffb870]"><MessageCircle size={16} /></div>
              <div>
                <p className="text-sm font-bold leading-none">Chat interno</p>
                <p className="ak-mono mt-1 text-[10px] uppercase tracking-wider text-zinc-500">{perfil?.nombre || 'Cargando...'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="text-zinc-500 hover:text-white"><X size={18} /></button>
          </div>

          <div className="flex gap-1.5 border-b border-white/10 bg-[#0c0f16] px-3 py-2">
            {CANALES.map((c) => {
              const Icon = c.icon
              const activo = c.slug === canal
              return (
                <button
                  key={c.slug}
                  onClick={() => setCanal(c.slug)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ${
                    activo ? 'bg-gradient-to-r from-[#8a4a1f] to-[#e2954d] text-[#0a0d12]' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} /> {c.label}
                </button>
              )
            })}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loading ? (
              <p className="text-center text-xs text-zinc-500">Cargando conversación...</p>
            ) : mensajes.length === 0 ? (
              <p className="text-center text-xs text-zinc-500">Todavía no hay mensajes en {canalActivo.label}. Escribe el primero.</p>
            ) : (
              mensajes.map((m) => {
                const esMio = perfil?.id === m.autor_id
                return (
                  <div key={m.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${esMio ? 'bg-[#e2954d] text-[#0a0d12]' : 'bg-white/[.06] text-zinc-100'}`}>
                      {!esMio && <p className="ak-mono mb-1 text-[10px] font-bold uppercase tracking-wider text-[#ffb870]">{m.autor_nombre}</p>}
                      <p className="whitespace-pre-wrap leading-5">{m.mensaje}</p>
                    </div>
                    <span className="mt-1 text-[10px] text-zinc-600">{formatHora(m.created_at)}</span>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 bg-[#10141c] p-3">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder={`Escribe en ${canalActivo.label}...`}
              className="!min-h-0 flex-1 !rounded-xl !py-2.5 text-sm"
            />
            <button
              onClick={enviar}
              disabled={!texto.trim() || sending}
              aria-label="Enviar mensaje"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#8a4a1f] to-[#e2954d] text-[#0a0d12] transition disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar chat interno' : 'Abrir chat interno'}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8a4a1f] to-[#e2954d] text-[#0a0d12] shadow-[0_18px_45px_rgba(226,149,77,.35)] transition hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unread > 0 && (
          <span className="ak-mono absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0a0d12] bg-[#5eead4] px-1 text-[10px] font-bold text-[#0a0d12]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
