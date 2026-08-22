'use client'

import { AlertTriangle, X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, loading = false, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onCancel}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0d12] shadow-[0_28px_90px_rgba(0,0,0,.62)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/[0.07] p-5">
          <div className="flex items-start gap-3.5">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${danger ? 'border-[#ef202d]/25 bg-[#ef202d]/10 text-[#ff5862]' : 'border-white/[0.08] bg-white/[0.025] text-zinc-400'}`}>
              <AlertTriangle size={19} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Autokeys Lab</div>
              <h3 className="mt-0.5 text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-white/[0.04] hover:text-white"><X size={15}/></button>
        </div>
        <div className="flex gap-2.5 p-4">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 rounded-lg border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{loading ? 'Un momento...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
