'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Grid3x3, Mail, Menu, ChevronDown } from 'lucide-react'
import UniversalSearch from '@/components/UniversalSearch'
import NotificationCenter from '@/components/NotificationCenter'
import { LabLogoMark, LabProBadge, LabWordmark } from './LabBrand'

export default function LabTopbar({ onMenu }: { onMenu: () => void }) {
  const [tallerOpen, setTallerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08090c]/96 px-4 backdrop-blur-xl sm:px-5 lg:px-6 2xl:px-8">
      <div className="flex h-[70px] items-center gap-3 sm:h-[72px] 2xl:h-[76px]">
        <button type="button" onClick={onMenu} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-zinc-300 xl:hidden" aria-label="Abrir menú"><Menu size={19} /></button>

        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 xl:hidden">
          <LabLogoMark size={36} />
          <div className="hidden sm:block"><LabWordmark /></div>
        </Link>

        <div className="hidden min-w-0 w-full max-w-[440px] md:block xl:max-w-[460px] 2xl:max-w-[500px]">
          <UniversalSearch placeholder="Buscar en Autokeys Lab..." />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button className="hidden h-10 w-10 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-white lg:grid" aria-label="Aplicaciones"><Grid3x3 size={18} strokeWidth={1.8} /></button>
          <NotificationCenter />
          <Link href="/notificaciones" className="hidden h-10 w-10 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-white sm:grid" aria-label="Mensajes"><Mail size={18} strokeWidth={1.8} /></Link>
          <div className="mx-1 hidden h-8 w-px bg-white/[0.07] lg:block" />

          <div className="relative hidden lg:block">
            <button onClick={() => setTallerOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium text-zinc-200 transition hover:bg-white/[0.035] 2xl:text-[13px]">
              <span className="max-w-[120px] truncate 2xl:max-w-none">Taller Central</span>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${tallerOpen ? 'rotate-180' : ''}`} />
            </button>
            {tallerOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setTallerOpen(false)} aria-hidden />
                <div className="absolute right-0 top-[48px] z-20 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl">
                  <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[.16em] text-zinc-600">Talleres</div>
                  <button className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] font-semibold text-white hover:bg-white/5">Taller Central</button>
                </div>
              </>
            )}
          </div>

          <LabProBadge size={42} />
        </div>
      </div>

      <div className="pb-3 md:hidden"><UniversalSearch placeholder="Buscar en Autokeys Lab..." /></div>
    </header>
  )
}
