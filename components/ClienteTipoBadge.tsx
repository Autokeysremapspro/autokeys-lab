export default function ClienteTipoBadge({ tipo }: { tipo?: string | null }) {
  const value = tipo || 'normal'
  const classes: Record<string, string> = {
    premium: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    normal: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    distribuidor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    moroso: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    bloqueado: 'bg-red-500/15 text-red-300 border-red-500/30',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${classes[value] || classes.normal}`}>
      {value}
    </span>
  )
}
