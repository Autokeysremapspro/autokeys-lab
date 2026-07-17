import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

export default function QuickAction({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.018] p-3.5 transition hover:-translate-y-0.5 hover:border-red-500/25 hover:bg-red-500/[0.045]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/15 bg-red-500/[0.08] text-red-300 transition group-hover:border-red-500/30 group-hover:bg-red-500/[0.13]">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-zinc-100">{title}</p>
        <p className="truncate text-xs text-zinc-500">{description}</p>
      </div>
      <ArrowUpRight size={15} className="text-zinc-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-300" />
    </Link>
  )
}
