import type { ReactNode } from 'react'
import { toneIconTile, type LabTone } from './theme'
import LabSparkline from './LabSparkline'

const defaultSparklines: Record<LabTone, number[]> = {
  red: [14,19,17,24,21,26,23,31,28,33,30,37],
  orange: [10,13,12,17,15,21,18,24,22,28,26,31],
  blue: [9,12,11,16,15,19,17,23,22,26,24,30],
  green: [11,14,13,16,15,19,17,21,20,24,22,27],
  purple: [18,21,19,24,22,26,23,29,27,31,29,35],
  zinc: [12,15,13,16,14,18,17,20,18,22,21,24],
}

export default function LabStatCard({ icon, tone = 'zinc', label, value, trend, subtitle, sparkline }: {
  icon: ReactNode
  tone?: LabTone
  label: string
  value: ReactNode
  trend?: number | null
  subtitle?: string
  sparkline?: number[]
}) {
  const positive = typeof trend === 'number' && trend >= 0
  const values = sparkline && sparkline.length > 1 ? sparkline : defaultSparklines[tone]
  return (
    <div className="min-h-[108px] rounded-xl border border-white/[0.085] bg-[linear-gradient(180deg,rgba(18,21,25,.95),rgba(10,12,15,.95))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.018)]">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneIconTile[tone]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-medium text-zinc-400">{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[25px] font-semibold leading-none tracking-[-0.03em] text-white">{value}</span>
            {typeof trend === 'number' && <span className={`text-[11px] font-semibold ${positive ? 'text-[#57c85e]' : 'text-[#ff413f]'}`}>{positive ? '+' : ''}{trend}%</span>}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="h-[22px] min-w-0 flex-1"><LabSparkline values={values} positive={positive} /></div>
        {subtitle && <div className="shrink-0 text-right text-[9px] text-zinc-600">{subtitle}</div>}
      </div>
    </div>
  )
}
