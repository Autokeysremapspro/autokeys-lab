'use client'

import Link from 'next/link'
import { Bell, Menu, Search, UploadCloud } from 'lucide-react'
import AKSidebar from './AKSidebar'
import AKApprovalGate from './AKApprovalGate'

export default function AKPageShell({
  children,
  title,
  subtitle,
  eyebrow = 'AK Cloud',
  actions,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  eyebrow?: string
  actions?: React.ReactNode
}) {
  return (
    <AKApprovalGate>
    <main className="ak-noise ak-grid flex min-h-screen bg-black text-white">
      <AKSidebar />
      <section className="relative z-10 min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/70 px-4 backdrop-blur-2xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 lg:hidden"><Menu size={20} /></button>
            <div className="hidden min-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/35 md:flex">
              <Search size={18} /> Buscar pedido, ECU, HW, SW...
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/nuevo-pedido" className="hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_35px_rgba(217,4,41,.30)] md:inline-flex md:items-center md:gap-2">
              <UploadCloud size={18} /> Nuevo pedido
            </Link>
            <Link href="/notificaciones" className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.08]">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-black">3</span>
            </Link>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {(title || subtitle) && (
            <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">{eyebrow}</p>
                {title && <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>}
                {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{subtitle}</p>}
              </div>
              {actions}
            </div>
          )}
          {children}
        </div>
      </section>
    </main>
    </AKApprovalGate>
  )
}
