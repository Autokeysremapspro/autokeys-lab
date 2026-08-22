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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08090c]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={19} />
        </button>

        <Link href="/" className="hidden shrink-0 items-center gap-3 lg:flex">
          <LabLogoMark size={40} />
          <LabWordmark />
        </Link>

        <div className="mx-auto hidden max-w-xl flex-1 md:block">
          <UniversalSearch placeholder="Buscar en Autokeys Lab..." />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="hidden h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-white sm:grid"
            aria-label="Aplicaciones"
          >
            <Grid3x3 size={17} />
          </button>

          <NotificationCenter />

          <Link
            href="/notificaciones"
            className="hidden h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-white sm:grid"
            aria-label="Mensajes"
          >
            <Mail size={17} />
          </Link>

          <div className="relative hidden md:block">
            <button
              onClick={() => setTallerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/[0.07]"
            >
              Taller Central
              <ChevronDown size={15} className={`text-zinc-500 transition-transform ${tallerOpen ? 'rotate-180' : ''}`} />
            </button>
            {tallerOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setTallerOpen(false)} aria-hidden />
                <div className="absolute right-0 top-[52px] z-20 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f14] shadow-2xl">
                  <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-600">Talleres</div>
                  <button className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-white hover:bg-white/5">
                    Taller Central
                  </button>
                </div>
              </>
            )}
          </div>

          <LabProBadge size={42} />
        </div>
      </div>

      <div className="mt-3 md:hidden">
        <UniversalSearch placeholder="Buscar en Autokeys Lab..." />
      </div>
    </header>
  )
}
