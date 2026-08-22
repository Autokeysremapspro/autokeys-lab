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
    <section className={`rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.012] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          {typeof title === 'string' ? <h2 className="text-[15px] font-bold text-white">{title}</h2> : title}
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}
