import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { toneIconTile, type LabTone } from './theme'
import LabSparkline from './LabSparkline'

export default function LabStatCard({
  icon,
  tone = 'zinc',
  label,
  value,
  trend,
  subtitle,
  sparkline,
}: {
  icon: ReactNode
  tone?: LabTone
  label: string
  value: ReactNode
  trend?: number | null
  subtitle?: string
  sparkline?: number[]
}) {
  const positive = typeof trend === 'number' && trend >= 0
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.035] to-white/[0.015] p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneIconTile[tone]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-zinc-400">{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {typeof trend === 'number' && (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${positive ? 'text-[#4ade95]' : 'text-[#ff5468]'}`}>
                {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {positive ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && <div className="mt-1 truncate text-[11px] text-zinc-600">{subtitle}</div>}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 h-8">
          <LabSparkline values={sparkline} positive={positive} />
        </div>
      )}
    </div>
  )
}
