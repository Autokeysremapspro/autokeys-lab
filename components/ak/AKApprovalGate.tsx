'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMiSolicitud, rutaPorEstado } from '@/lib/services/distribuidores'

export default function AKApprovalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true

    async function check() {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      if (!data.session) {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/dashboard')}`)
        return
      }

      try {
        const solicitud = await getMiSolicitud()
        if (!alive) return
        // Usuarios antiguos sin solicitud conservan el acceso. Los nuevos quedan controlados por estado.
        if (solicitud && solicitud.estado !== 'aprobada') {
          router.replace(rutaPorEstado(solicitud.estado))
          return
        }
        setReady(true)
      } catch (error) {
        console.error('No se pudo comprobar la aprobación del distribuidor:', error)
        setReady(true)
      }
    }

    check()
    return () => { alive = false }
  }, [pathname, router])

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
          <p className="mt-5 text-xs font-black uppercase tracking-[.25em] text-white/45">Verificando acceso AK Cloud</p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
