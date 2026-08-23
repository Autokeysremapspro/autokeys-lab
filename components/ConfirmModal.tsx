'use client'

import { AlertTriangle } from 'lucide-react'

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

// Sustituye a window.confirm() — mismo propósito (confirmar una acción
// importante antes de ejecutarla) pero con el estilo del ERP en vez del
// diálogo genérico del navegador, y sin bloquear el hilo de JS.
export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${danger ? 'bg-red-500/15 text-red-300' : 'bg-[#c81f2a]/15 text-[#ff5468]'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn btn-dark flex-1">{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 disabled:opacity-50 ${danger ? 'bg-red-600 text-white hover:bg-red-500' : 'btn-red'}`}
          >
            {loading ? 'Un momento...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
