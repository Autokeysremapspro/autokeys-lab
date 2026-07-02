type Props = {
  label: string
  value: number
  target: number
  suffix?: string
  money?: boolean
}

function formatValue(value: number, money?: boolean, suffix?: string) {
  if (money) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
  }
  return `${Math.round(value || 0)}${suffix || ''}`
}

export default function KpiProgress({ label, value, target, suffix, money }: Props) {
  const safeTarget = Number(target || 0)
  const pct = safeTarget > 0 ? Math.min((Number(value || 0) / safeTarget) * 100, 999) : 0
  const ok = pct >= 100

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-zinc-500 font-bold">{label}</p>
          <p className="text-2xl font-black mt-2">{formatValue(value, money, suffix)}</p>
          <p className="text-xs text-zinc-500 mt-1">Objetivo: {formatValue(safeTarget, money, suffix)}</p>
        </div>
        <div className={`text-sm font-black ${ok ? 'text-emerald-400' : 'text-red-300'}`}>
          {Math.round(pct)}%
        </div>
      </div>
      <div className="h-3 rounded-full bg-black/40 overflow-hidden mt-4 border border-white/10">
        <div
          className={`h-full rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-600'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
