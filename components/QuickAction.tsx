import Link from 'next/link'
import type { ReactNode } from 'react'

export default function QuickAction({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-red-900/70 hover:-translate-y-0.5 transition block">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-red-600/15 border border-red-900/50 grid place-items-center text-red-300">{icon}</div>
        <div>
          <p className="font-black">{title}</p>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
    </Link>
  )
}
