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
    <section className={`overflow-hidden rounded-xl border border-white/[0.085] bg-[linear-gradient(180deg,rgba(17,20,24,.92),rgba(10,12,15,.94))] shadow-[inset_0_1px_0_rgba(255,255,255,.018)] ${className}`}>
      {(title || action) && (
        <div className="flex min-h-[46px] items-center justify-between gap-3 border-b border-white/[0.065] px-4 py-3">
          {typeof title === 'string' ? <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-white">{title}</h2> : title}
          {action}
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}
