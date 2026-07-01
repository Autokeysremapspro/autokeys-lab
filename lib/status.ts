export function statusClass(status?: string) {
  switch (status) {
    case 'terminado': return 'bg-green-900/50 text-green-300 border border-green-700'
    case 'entregado': return 'bg-blue-900/50 text-blue-300 border border-blue-700'
    case 'en_proceso': return 'bg-amber-900/50 text-amber-300 border border-amber-700'
    case 'pendiente_cliente': return 'bg-purple-900/50 text-purple-300 border border-purple-700'
    case 'cancelado': return 'bg-red-900/50 text-red-300 border border-red-700'
    default: return 'bg-zinc-800 text-zinc-300 border border-zinc-700'
  }
}
export function money(v?: number | string | null) { return `${Number(v || 0).toFixed(2)} €` }
