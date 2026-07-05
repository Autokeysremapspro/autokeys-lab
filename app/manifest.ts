import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Autokeys Core',
    short_name: 'AK Core',
    description: 'App móvil PWA para alta rápida de clientes, vehículos y expedientes de Autokeys Lab.',
    start_url: '/mobile',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#dc2626',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
