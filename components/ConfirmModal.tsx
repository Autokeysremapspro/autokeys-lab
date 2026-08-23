'use client'

import { AlertTriangle, X } from 'lucide-react'

type Props = { open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onCancel: () => void }

export default function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, loading = false, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/82 p-4 backdrop-blur-md" onClick={onCancel}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0d12] shadow-[0_30px_100px_rgba(0,0,0,.66)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${danger ? 'border-[#ef202d]/25 bg-[#ef202d]/10 text-[#ff5862]' : 'border-white/[0.08] bg-white/[0.025] text-zinc-400'}`}><AlertTriangle size={22} /></div>
            <div><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ef202d]">Autokeys Lab</div><h3 className="mt-1 text-[20px] font-semibold text-white">{title}</h3><p className="mt-2 text-[14px] leading-6 text-zinc-400">{description}</p></div>
          </div>
          <button type="button" onClick={onCancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-zinc-600 hover:bg-white/[0.04] hover:text-white"><X size={17}/></button>
        </div>
        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:p-6">
          <button type="button" onClick={onCancel} className="min-h-[46px] flex-1 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-[13px] font-semibold text-zinc-300 hover:bg-white/[0.05]">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="min-h-[46px] flex-1 rounded-xl border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-4 py-3 text-[13px] font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] hover:brightness-110 disabled:opacity-50">{loading ? 'Un momento...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
