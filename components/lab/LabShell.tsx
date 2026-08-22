'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LabSidebar from './LabSidebar'
import LabTopbar from './LabTopbar'
import LabFooterBar from './LabFooterBar'

const headerlessRoutes = new Set(['/', '/clientes', '/facturas', '/file-service'])

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
  const pathname = usePathname() || '/'
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
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
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
      <main className="grid min-h-screen place-items-center bg-[#07080a] p-5 text-zinc-100 sm:p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0f13] p-6 text-center shadow-2xl sm:p-7">
          <div className="text-xl font-bold tracking-tight sm:text-2xl">Autokeys <span className="text-[#ef202d]">Lab</span></div>
          <p className="mt-3 text-xs text-zinc-500 sm:text-sm">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  const hideHeader = headerlessRoutes.has(pathname)
  const showHeader = !hideHeader && (title || actions)

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100">
      <div className="flex min-h-screen">
        <LabSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_70%_-15%,rgba(255,255,255,.025),transparent_28%),linear-gradient(180deg,#090a0d_0%,#07080a_100%)]">
          <LabTopbar onMenu={() => setSidebarOpen(true)} />
          <main className="flex min-h-0 flex-1 flex-col px-3 pb-0 pt-3 sm:px-4 sm:pt-4 lg:px-5 xl:px-5 2xl:px-6 2xl:pt-5">
            {showHeader && (
              <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {breadcrumb && <p className="mb-1 truncate text-[9px] font-semibold text-zinc-600 sm:text-[10px]">{breadcrumb}</p>}
                  {title && <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[21px] 2xl:text-[22px]">{title}</h1>}
                  {subtitle && <p className="mt-1 max-w-3xl text-[11px] leading-5 text-zinc-500 sm:text-[12px]">{subtitle}</p>}
                </div>
                {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-x-hidden">{children}</div>
            {footer && <LabFooterBar />}
          </main>
        </div>
      </div>
    </div>
  )
}
