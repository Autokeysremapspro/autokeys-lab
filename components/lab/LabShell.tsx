'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LabSidebar from './LabSidebar'
import LabTopbar from './LabTopbar'
import LabFooterBar from './LabFooterBar'

export default function LabShell({
  title,
  subtitle,
  breadcrumb,
  actions,
  footer = true,
  children,
}: {
  title?: string
  subtitle?: string
  breadcrumb?: string
  actions?: ReactNode
  footer?: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let alive = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      if (!data.session) {
        setAuthorized(false)
        setCheckingSession(false)
        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
        return
      }
      setAuthorized(true)
      setCheckingSession(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      if (!session) {
        setAuthorized(false)
        router.replace('/login')
        return
      }
      setAuthorized(true)
      setCheckingSession(false)
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  if (checkingSession || !authorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080b] p-6 text-zinc-100">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0f14] p-8 text-center">
          <div className="text-2xl font-bold tracking-tight">
            Autokeys <span className="text-[#ff3b46]">Lab</span>
          </div>
          <p className="mt-3 text-zinc-500">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#07080b] text-zinc-100">
      <LabSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <LabTopbar onMenu={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-[1700px] flex-1 p-4 sm:p-6">
          {(title || actions) && (
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                {breadcrumb && <p className="mb-1 text-xs font-semibold text-zinc-600">{breadcrumb}</p>}
                {title && <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}

          {children}

          {footer && <LabFooterBar />}
        </main>
      </div>
    </div>
  )
}
