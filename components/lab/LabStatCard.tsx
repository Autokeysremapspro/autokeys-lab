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
    <div className="min-h-[140px] rounded-2xl border border-white/[0.085] bg-[linear-gradient(180deg,rgba(18,21,25,.95),rgba(10,12,15,.95))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.018)] 2xl:min-h-[148px] 2xl:px-6">
      <div className="flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full 2xl:h-[52px] 2xl:w-[52px] ${toneIconTile[tone]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-zinc-400 2xl:text-[15px]">{label}</div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.035em] text-white 2xl:text-[38px]">{value}</span>
            {typeof trend === 'number' && <span className={`text-[13px] font-semibold ${positive ? 'text-[#57c85e]' : 'text-[#ff413f]'}`}>{positive ? '+' : ''}{trend}%</span>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="h-[30px] min-w-0 flex-1"><LabSparkline values={values} positive={positive} /></div>
        {subtitle && <div className="max-w-[120px] shrink-0 text-right text-[11px] leading-4 text-zinc-500 2xl:text-[12px]">{subtitle}</div>}
      </div>
    </div>
  )
}
