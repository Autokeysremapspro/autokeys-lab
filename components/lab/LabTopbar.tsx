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
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08090c]/96 px-4 backdrop-blur-xl sm:px-5 lg:px-6">
      <div className="flex h-[74px] items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.035] text-zinc-300 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <LabLogoMark size={36} />
          <LabWordmark />
        </Link>

        <div className="hidden w-full max-w-[420px] md:block">
          <UniversalSearch placeholder="Buscar en Autokeys Lab..." />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            className="hidden h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-white sm:grid"
            aria-label="Aplicaciones"
          >
            <Grid3x3 size={17} strokeWidth={1.8} />
          </button>

          <NotificationCenter />

          <Link
            href="/notificaciones"
            className="hidden h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-white sm:grid"
            aria-label="Mensajes"
          >
            <Mail size={17} strokeWidth={1.8} />
          </Link>

          <div className="mx-1 hidden h-7 w-px bg-white/[0.07] md:block" />

          <div className="relative hidden md:block">
            <button
              onClick={() => setTallerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-zinc-200 transition hover:bg-white/[0.035]"
            >
              Taller Central
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${tallerOpen ? 'rotate-180' : ''}`} />
            </button>
            {tallerOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setTallerOpen(false)} aria-hidden />
                <div className="absolute right-0 top-[46px] z-20 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl">
                  <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-600">Talleres</div>
                  <button className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-white/5">
                    Taller Central
                  </button>
                </div>
              </>
            )}
          </div>

          <LabProBadge size={43} />
        </div>
      </div>

      <div className="pb-3 md:hidden">
        <UniversalSearch placeholder="Buscar en Autokeys Lab..." />
      </div>
    </header>
  )
}
