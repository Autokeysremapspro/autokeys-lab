'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, Wrench, Building2, Users, X, Bell, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const scrollRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  const canalRef = useRef(canal)
  const perfilRef = useRef(perfil)
  const permissionRef = useRef(permission)

  openRef.current = open
  canalRef.current = canal
  perfilRef.current = perfil
  permissionRef.current = permission

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    const abrirChat = (event: Event) => {
      const detail = (event as CustomEvent<{ canal?: CanalChat }>).detail
      if (detail?.canal && CANALES.some((item) => item.slug === detail.canal)) setCanal(detail.canal)
      setOpen(true)
    }
    window.addEventListener('ak-core-open-chat', abrirChat)
    return () => window.removeEventListener('ak-core-open-chat', abrirChat)
  }, [])

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

    return () => {
      mounted = false
    }
  }, [canal])

  useEffect(() => {
    const unsubscribe = suscribirMensajes(null, (nuevo) => {
      const esMio = perfilRef.current?.id === nuevo.autor_id

      if (nuevo.canal === canalRef.current) {
        setMensajes((current) => current.some((item) => item.id === nuevo.id) ? current : [...current, nuevo])
      }
      if (!openRef.current || nuevo.canal !== canalRef.current) setUnread((count) => count + 1)
      if (esMio) return

      const nombreCanal = CANALES.find((item) => item.slug === nuevo.canal)?.label || 'Chat interno'
      const resumen = nuevo.mensaje.length > 120 ? nuevo.mensaje.slice(0, 117) + '…' : nuevo.mensaje
      toast(nuevo.autor_nombre + ' · ' + nombreCanal + ': ' + resumen, {
        icon: '💬',
        duration: 7000,
      })

      if (document.hidden && permissionRef.current === 'granted') {
        try {
          const notification = new Notification('AK Core · ' + nombreCanal, {
            body: nuevo.autor_nombre + ': ' + resumen,
            tag: 'ak-core-chat-' + nuevo.id,
          })
          notification.onclick = () => {
            window.focus()
            window.dispatchEvent(new CustomEvent('ak-core-open-chat', { detail: { canal: nuevo.canal } }))
            notification.close()
          }
        } catch (error) {
          console.warn('No se pudo mostrar el aviso del chat', error)
        }
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, open])

  useEffect(() => {
    if (open) {
      setUnread(0)
      try { window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()) } catch {}
    }
  }, [open, canal])

  async function activarAvisos() {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      toast.error('Este navegador no admite avisos de escritorio')
      return
    }
    if (Notification.permission === 'denied') {
      setPermission('denied')
      toast.error('Los avisos están bloqueados en los permisos del navegador')
      return
    }

    const result = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') toast.success('Avisos del chat activados')
    else toast('El chat seguirá mostrando avisos dentro de AK Core')
  }

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
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c81f2a]/15 text-[#ff5468]"><MessageCircle size={16} /></div>
              <div>
                <p className="text-sm font-bold leading-none">Chat interno</p>
                <p className="ak-mono mt-1 text-[10px] uppercase tracking-wider text-zinc-500">{perfil?.nombre || 'Cargando...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={activarAvisos}
                aria-label={permission === 'granted' ? 'Avisos de escritorio activados' : 'Activar avisos de escritorio'}
                title={permission === 'granted' ? 'Avisos de escritorio activados' : 'Activar avisos de escritorio'}
                className={permission === 'granted' ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'}
              >
                {permission === 'granted' ? <BellRing size={17} /> : <Bell size={17} />}
              </button>
              <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
          </div>

          <div className="flex gap-1.5 border-b border-white/10 bg-[#0c0f16] px-3 py-2">
            {CANALES.map((c) => {
              const Icon = c.icon
              const activo = c.slug === canal
              return (
                <button
                  key={c.slug}
                  onClick={() => setCanal(c.slug)}
                  className={'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ' + (
                    activo ? 'bg-gradient-to-r from-[#7a0f16] to-[#c81f2a] text-[#0a0d12]' : 'text-zinc-400 hover:bg-white/5'
                  )}
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
                  <div key={m.id} className={'flex flex-col ' + (esMio ? 'items-end' : 'items-start')}>
                    <div className={'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ' + (esMio ? 'bg-[#c81f2a] text-[#0a0d12]' : 'bg-white/[.06] text-zinc-100')}>
                      {!esMio && <p className="ak-mono mb-1 text-[10px] font-bold uppercase tracking-wider text-[#ff5468]">{m.autor_nombre}</p>}
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
              placeholder={'Escribe en ' + canalActivo.label + '...'}
              className="!min-h-0 flex-1 !rounded-xl !py-2.5 text-sm"
            />
            <button
              onClick={enviar}
              disabled={!texto.trim() || sending}
              aria-label="Enviar mensaje"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7a0f16] to-[#c81f2a] text-[#0a0d12] transition disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar chat interno' : 'Abrir chat interno'}
        className="relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-[#7a0f16] to-[#c81f2a] px-5 text-white shadow-[0_18px_45px_rgba(200,31,42,.35)] transition hover:scale-[1.03]"
      >
        {open ? <X size={21} /> : <MessageCircle size={21} />}
        <span className="text-sm font-bold">Comunicación</span>
        {!open && unread > 0 && (
          <span className="ak-mono absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0a0d12] bg-[#5eead4] px-1 text-[10px] font-bold text-[#0a0d12]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
