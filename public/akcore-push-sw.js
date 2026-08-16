self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'AK Core'
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    tag: data.tag || `akcore-${Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(data.urgent),
    vibrate: data.urgent ? [250, 120, 250, 120, 350] : [180, 80, 180],
    data: {
      url: data.url || '/notificaciones',
      modulo: data.modulo || 'Sistema',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification?.data?.url || '/notificaciones'
  const absoluteTarget = new URL(target, self.location.origin).href

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(absoluteTarget)
        return
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(absoluteTarget)
  })())
})
