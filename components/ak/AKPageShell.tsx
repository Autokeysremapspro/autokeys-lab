'use client'

import { useState, type ReactNode } from 'react'
import AKApprovalGate from './AKApprovalGate'
import AKSidebar from './AKSidebar'
import AKTopbar from './AKTopbar'

export default function AKPageShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <AKApprovalGate>
      <div className="min-h-screen bg-[#07090d] text-zinc-100">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(220,38,38,.12),transparent_34%),radial-gradient(circle_at_5%_80%,rgba(127,29,29,.10),transparent_30%)]" />
        <div className="relative flex min-h-screen">
          <AKSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

          <div className="min-w-0 flex-1">
            <AKTopbar onMenu={() => setMenuOpen(true)} />
            <main className="p-4 sm:p-6 xl:p-8">
              {(title || description || actions) && (
                <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                  <div>
                    {title && <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>}
                    {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>}
                  </div>
                  {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </div>
    </AKApprovalGate>
  )
}
