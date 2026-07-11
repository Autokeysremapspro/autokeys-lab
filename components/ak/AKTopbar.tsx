'use client'

import Link from 'next/link'
import { Bell, Menu, Search, UploadCloud } from 'lucide-react'

export default function AKTopbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d12]/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={19} />
        </button>

        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2.5 md:flex">
          <Search size={17} className="text-zinc-600" />
          <span className="truncate text-sm text-zinc-600">Buscar pedidos, distribuidores, ECU, HW o SW...</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ak-cloud/produccion"
            className="hidden items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-300 transition hover:bg-red-500/15 sm:inline-flex"
          >
            <UploadCloud size={17} /> Producción
          </Link>
          <Link
            href="/notificaciones"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:text-white"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </Link>
        </div>
      </div>
    </header>
  )
}
