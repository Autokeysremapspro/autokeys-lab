'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Bell, BellRing, CheckCheck, ClipboardList, FileText, Info, Package, UploadCloud, AlertTriangle, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { crearAvisosAutomaticosBasicos, getNotificacionesNoLeidas, marcarNotificacionLeida, marcarTodasLeidas } from '@/lib/services/notificaciones'
import type { Notificacion } from '@/types/notificaciones'

type Item = Notificacion & { virtual?: boolean }
type BrowserPermission = NotificationPermission | 'unsupported'
type PushState = 'unsupported' | 'inactive' | 'activating' | 'active' | 'error'

const VAPID_PUBLIC_KEY = 'BL0mn3NRKXxxI_03V0ws7nYH2_c3IpTZq1-hkSNIwYQbwRDHCdtpYYz7jUzbdiSQzqbcziDhxS_AOYJOg2xE_fA'

const iconByModule: Record<string, any> = {
  Expedientes: ClipboardList,
  'File Service': UploadCloud,
  'file-service': UploadCloud,
  'AK Cloud': UploadCloud,
  ak_cloud: UploadCloud,
  Stock: Package,
  Facturación: FileText,
}

const toneByType: Record<string, string> = {
  info: 'text-sky-400 bg-sky-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-orange-400 bg-orange-500/10',
  danger: 'text-red-400 bg-red-500/10',
}

function iconFor(item: Item) {
  if (item.tipo === 'danger') return ShieldAlert
  if (item.tipo === 'warning') return AlertTriangle
  return iconByModule[item.modulo || ''] || Info
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index)
  return output
}

function playAlertSound(urgent = false) {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.22 : 0.13, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (urgent ? 0.85 : 0.45))

    const frequencies = urgent ? [880, 660, 880] : [760, 980]
    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      const start = now + index * (urgent ? 0.22 : 0.16)
      oscillator.start(start)
      oscillator.stop(start + (urgent ? 0.18 : 0.12))
    })

    window.setTimeout(() => ctx.close().catch(() => undefined), 1200)
  } catch (error) {
    console.debug('Audio notification blocked by browser', error)
  }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [persisted, setPersisted] = useState<Notificacion[]>([])
  const [virtuals, setVirtuals] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [browserPermission, setBrowserPermission] = useState<BrowserPermission>('unsupported')
  const [pushState, setPushState] = useState<PushState>('inactive')
  const pushActiveRef = useRef(false)

  useEffect(() => {
    pushActiveRef.current = pushState === 'active'
  }, [pushState])

  async function load() {
    setLoading(true)
    try {
      const [saved, generated] = await Promise.all([
        getNotificacionesNoLeidas(20),
        crearAvisosAutomaticosBasicos(),
      ])
      setPersisted(saved)
      setVirtuals(generated.map((item, index) => ({
        id: `virtual-${index}`,
        leida: false,
        created_at: new Date().toISOString(),
        virtual: true,
        ...item,
      } as Item)))
    } catch (err) {
      console.error('Notifications error', err)
    } finally {
      setLoading(false)
    }
  }

  function shouldEmit(key: string) {
    try {
      const storageKey = `ak-core-browser-alert:${key}`
      const previous = Number(window.localStorage.getItem(storageKey) || 0)
      const now = Date.now()
      if (previous && now - previous < 30_000) return false
      window.localStorage.setItem(storageKey, String(now))
    } catch {
      // Mejor avisar dos veces que perder un pedido si localStorage no está disponible.
    }
    return true
  }

  function emitRealtimeAlert(item: Notificacion) {
    const key = String(item.metadata?.event_key || item.id)
    if (!shouldEmit(key)) return

    const urgent = item.prioridad === 'urgente' || item.tipo === 'danger'
    const body = String(item.mensaje || '').slice(0, 260)
    const href = item.href || '/notificaciones'

    playAlertSound(urgent)
    toast(`${item.titulo}${body ? ` · ${body}` : ''}`, {
      icon: urgent ? '🚨' : '🔔',
      duration: urgent ? 12_000 : 8_000,
    })

    window.dispatchEvent(new CustomEvent('akcore:notification', { detail: item }))

    if (pushActiveRef.current || !('Notification' in window) || Notification.permission !== 'granted') return

    try {
      const notification = new Notification(item.titulo, {
        body,
        tag: key,
        requireInteraction: urgent,
      })
      notification.onclick = () => {
        window.focus()
        window.location.href = href
        notification.close()
      }
    } catch (error) {
      console.warn('No se pudo mostrar la notificación del navegador', error)
    }
  }

  async function persistPushSubscription(subscription: PushSubscription) {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    if (!userId) throw new Error('Sesión no disponible para registrar Web Push')

    const json = subscription.toJSON()
    const p256dh = json.keys?.p256dh
    const auth = json.keys?.auth
    if (!p256dh || !auth) throw new Error('El navegador no devolvió las claves Push')

    const { error } = await supabase
      .from('ak_push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (error) throw error
  }

  async function enableWebPush() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported')
      setPushState('unsupported')
      toast.error('Este navegador no admite notificaciones web')
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported')
      toast.error('Este navegador no admite Web Push persistente')
      return
    }

    setPushState('activating')
    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      setBrowserPermission(permission)

      if (permission !== 'granted') {
        setPushState('inactive')
        if (permission === 'denied') toast.error('El navegador ha bloqueado las notificaciones de AK Core')
        return
      }

      const registration = await navigator.serviceWorker.register('/akcore-push-sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      await persistPushSubscription(subscription)
      setPushState('active')
      playAlertSound(false)
      toast.success('Push real activado en AK Core')
    } catch (error: any) {
      console.error('Web Push activation error', error)
      setPushState('error')
      toast.error(error?.message || 'No se pudo activar Web Push')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('Notification' in window) setBrowserPermission(Notification.permission)
    else setBrowserPermission('unsupported')

    async function inspectPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushState('unsupported')
        return
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) {
          await persistPushSubscription(subscription)
          setPushState('active')
        } else {
          setPushState('inactive')
        }
      } catch (error) {
        console.warn('No se pudo comprobar la suscripción Web Push', error)
        setPushState('inactive')
      }
    }

    inspectPush()
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('ak-core-notification-bus')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const item = payload.new as Notificacion
          setPersisted((current) => [item, ...current.filter((existing) => existing.id !== item.id)].slice(0, 20))
          emitRealtimeAlert(item)
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('AK Core notification realtime channel error')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const items = useMemo(() => {
    const out: Item[] = [...persisted, ...virtuals]
    const seen = new Set<string>()
    return out.filter((item) => {
      const key = `${item.titulo}-${item.mensaje}-${item.href}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 20)
  }, [persisted, virtuals])

  async function markOne(item: Item) {
    if (!item.virtual) {
      await marcarNotificacionLeida(item.id)
      await load()
    }
    setOpen(false)
  }

  async function markAll() {
    await marcarTodasLeidas()
    await load()
  }

  const pushReady = browserPermission === 'granted' && pushState === 'active'

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-12 w-12 rounded-2xl bg-[#0B1220] border border-white/10 flex items-center justify-center hover:bg-white/5 transition" title="Centro de avisos">
        <Bell size={18} />
        {items.length > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-[#e2954d] text-[10px] font-bold text-[#0a0d12] flex items-center justify-center">{items.length}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[56px] z-50 w-[390px] bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold">Centro de avisos</div>
              <div className="text-xs text-zinc-500 mt-1">Pedidos, pagos, distribuidores, chat, soporte y operaciones.</div>
            </div>
            <button onClick={markAll} className="text-xs font-bold text-[#ffb870] hover:text-[#ffd39f] flex items-center gap-1">
              <CheckCheck size={14} /> Leer todo
            </button>
          </div>

          {!pushReady && (
            <div className="p-3 border-b border-white/10 bg-[#e2954d]/5">
              <button
                type="button"
                onClick={enableWebPush}
                disabled={browserPermission === 'denied' || browserPermission === 'unsupported' || pushState === 'unsupported' || pushState === 'activating'}
                className="w-full rounded-2xl border border-[#e2954d]/30 bg-[#e2954d]/10 px-4 py-3 text-left hover:bg-[#e2954d]/15 disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffb870]"><BellRing size={16} /> {pushState === 'activating' ? 'Activando push...' : 'Activar push real + sonido'}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {browserPermission === 'denied'
                    ? 'Las notificaciones están bloqueadas en los permisos del navegador.'
                    : pushState === 'unsupported' || browserPermission === 'unsupported'
                      ? 'Este navegador no admite Web Push persistente.'
                      : 'Recibe pedidos y mensajes aunque AK Core no esté en primer plano.'}
                </div>
              </button>
            </div>
          )}

          {pushReady && (
            <div className="flex items-center gap-2 border-b border-white/10 bg-emerald-500/5 px-4 py-2 text-xs font-bold text-emerald-300">
              <BellRing size={14} /> Push real y sonido activos
            </div>
          )}

          <div className="p-2 max-h-[460px] overflow-auto">
            {loading && items.length === 0 && <div className="p-5 text-sm text-zinc-500">Cargando avisos...</div>}
            {!loading && items.length === 0 && <div className="p-5 text-sm text-zinc-500">No hay avisos pendientes.</div>}

            {items.map((item) => {
              const Icon = iconFor(item)
              return (
                <Link
                  key={item.id}
                  href={item.href || '/notificaciones'}
                  onClick={() => markOne(item)}
                  className="flex gap-3 p-3 rounded-2xl hover:bg-white/5 transition"
                >
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${toneByType[item.tipo] || toneByType.info}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{item.titulo}</div>
                    {item.mensaje && <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.mensaje}</div>}
                    <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-bold">
                      {item.modulo || 'Sistema'} · {item.prioridad || 'normal'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <Link href="/notificaciones" onClick={() => setOpen(false)} className="block p-4 border-t border-white/10 text-center text-sm font-bold text-[#ffb870] hover:bg-white/5">
            Ver centro de avisos
          </Link>
        </div>
      )}
    </div>
  )
}
