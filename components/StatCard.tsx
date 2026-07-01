import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: ReactNode
  subtitle?: string
  icon?: ReactNode
  tone?: 'red' | 'green' | 'amber' | 'blue' | 'zinc'
}

const toneClasses = {
  red: 'from-red-500/20 to-red-950/20 border-red-900/50 text-red-300',
  green: 'from-green-500/20 to-green-950/20 border-green-900/50 text-green-300',
  amber: 'from-amber-500/20 to-amber-950/20 border-amber-900/50 text-amber-300',
  blue: 'from-blue-500/20 to-blue-950/20 border-blue-900/50 text-blue-300',
  zinc: 'from-zinc-500/10 to-zinc-950/20 border-zinc-800 text-zinc-300',
}

export default function StatCard({ title, value, subtitle, icon, tone = 'zinc' }: StatCardProps) {
  return (
    <div className={`card p-5 overflow-hidden relative border ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400 font-semibold">{title}</p>
          <div className="text-3xl font-black mt-2 text-white">{value}</div>
          {subtitle && <p className="text-xs text-zinc-500 mt-2">{subtitle}</p>}
        </div>
        {icon && <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">{icon}</div>}
      </div>
      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />
    </div>
  )
}
