export function expedienteStatusClass(status?: string | null) {
  switch (status) {
    case 'terminado':
    case 'entregado':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'en_proceso':
    case 'diagnostico':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'pendiente_cliente':
    case 'pendiente_material':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    case 'cancelado':
      return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
    default:
      return 'bg-red-500/15 text-red-300 border-red-500/30'
  }
}

export default function ExpedienteStatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${expedienteStatusClass(status)}`}>
      {status || 'recibido'}
    </span>
  )
}
