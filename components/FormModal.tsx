'use client'

import { X } from 'lucide-react'

export default function FormModal({ open, title, onClose, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0d12] shadow-[0_28px_90px_rgba(0,0,0,.62)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Autokeys Lab</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-zinc-500 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
