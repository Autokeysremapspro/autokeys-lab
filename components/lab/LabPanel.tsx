import type { ReactNode } from 'react'

export default function LabPanel({
  title,
  action,
  className = '',
  children,
  padded = true,
}: {
  title?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
  padded?: boolean
}) {
  return (
    <section className={`relative overflow-visible rounded-2xl border border-white/[0.085] bg-[linear-gradient(180deg,rgba(17,20,24,.92),rgba(10,12,15,.94))] shadow-[inset_0_1px_0_rgba(255,255,255,.018)] ${className}`}>
      {(title || action) && (
        <div className="flex min-h-[54px] items-center justify-between gap-3 rounded-t-2xl border-b border-white/[0.065] px-5 py-3.5">
          {typeof title === 'string' ? <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-white">{title}</h2> : title}
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
