import type { ReactNode } from 'react'
import AKCard from './AKCard'

export default function AKStatCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  detail?: ReactNode
}) {
  return (
    <AKCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</div>
          {detail && <div className="mt-2 text-xs text-zinc-500">{detail}</div>}
        </div>
        {icon && <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#c81f2a]/20 bg-[#c81f2a]/10 text-[#ff5468]">{icon}</div>}
      </div>
    </AKCard>
  )
}
