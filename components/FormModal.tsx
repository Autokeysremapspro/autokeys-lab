'use client'

import { X } from 'lucide-react'

export default function FormModal({ open, title, onClose, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-5" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0d12] shadow-[0_28px_90px_rgba(0,0,0,.62)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Autokeys Lab</div>
            <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-zinc-500 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white" aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-150px)] overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
