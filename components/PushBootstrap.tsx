'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = 'BH0ZHUUrKaZRUFihKdayn2wRqorRYXLMMxd_npHhRMnAuwGPsIXx37KhqJcah6MnWhUo0A_lX5S4jOA5WV1iJUE'
const VAPID_VERSION = '2026-08-16-v2'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export default function PushBootstrap() {
  useEffect(() => {
    async function syncPush() {
      if (typeof window === 'undefined') return
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      try {
        const registration = await navigator.serviceWorker.register('/akcore-push-sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        let subscription = await registration.pushManager.getSubscription()
        const storedVersion = window.localStorage.getItem('akcore-vapid-version')
        if (subscription && storedVersion !== VAPID_VERSION) {
          await subscription.unsubscribe()
          subscription = null
        }

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) return

        const json = subscription.toJSON()
        const p256dh = json.keys?.p256dh
        const auth = json.keys?.auth
        if (!p256dh || !auth) return

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

        if (!error) window.localStorage.setItem('akcore-vapid-version', VAPID_VERSION)
      } catch (error) {
        console.error('AK Core Push bootstrap error', error)
      }
    }

    syncPush()
  }, [])

  return null
}
