import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: ReactNode
  subtitle?: string
  icon?: ReactNode
  tone?: 'red' | 'green' | 'amber' | 'blue' | 'zinc'
}

const toneClasses = {
  red: 'text-red-300 bg-red-500/10 border-red-500/20',
  green: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  blue: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  zinc: 'text-zinc-300 bg-white/[0.035] border-white/10',
}

export default function StatCard({ title, value, subtitle, icon, tone = 'zinc' }: StatCardProps) {
  return (
    <div className="card group overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.13] hover:shadow-2xl hover:shadow-black/30">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-zinc-500">{title}</p>
          <div className="mt-2.5 truncate text-3xl font-black tracking-[-0.04em] text-white">{value}</div>
          {subtitle && <p className="mt-2 truncate text-xs font-medium text-zinc-500">{subtitle}</p>}
        </div>
        {icon && <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${toneClasses[tone]}`}>{icon}</div>}
      </div>
      <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
  )
}
