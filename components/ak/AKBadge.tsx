import type { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export default function AKBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: 'border-white/10 bg-white/[0.05] text-zinc-400',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    danger: 'border-red-500/25 bg-red-500/10 text-red-300',
    info: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}
