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
      <main className="grid min-h-screen place-items-center bg-[#07080a] p-6 text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0f13] p-7 text-center shadow-2xl">
          <div className="text-2xl font-bold tracking-tight">Autokeys <span className="text-[#ef202d]">Lab</span></div>
          <p className="mt-3 text-sm text-zinc-500">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100">
      <div className="flex min-h-screen">
        <LabSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_70%_-15%,rgba(255,255,255,.025),transparent_28%),linear-gradient(180deg,#090a0d_0%,#07080a_100%)]">
          <LabTopbar onMenu={() => setSidebarOpen(true)} />

          <main className="flex min-h-0 flex-1 flex-col px-4 pb-0 pt-4 sm:px-5 lg:px-6 lg:pt-5">
            {(title || actions) && (
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  {breadcrumb && <p className="mb-1 text-[10px] font-semibold text-zinc-600">{breadcrumb}</p>}
                  {title && <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.025em] text-white">{title}</h1>}
                  {subtitle && <p className="mt-1 text-[12px] text-zinc-500">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
            )}

            <div className="min-h-0 flex-1">{children}</div>
            {footer && <LabFooterBar />}
          </main>
        </div>
      </div>
    </div>
  )
}
