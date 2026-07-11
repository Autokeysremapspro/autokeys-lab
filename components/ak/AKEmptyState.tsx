import type { ReactNode } from 'react'

export default function AKEmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] text-zinc-500">{icon}</div>}
      <h3 className="text-lg font-black text-white">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
