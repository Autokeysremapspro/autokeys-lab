import type { HTMLAttributes, ReactNode } from 'react'

export default function AKCard({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...props}
      className={`rounded-3xl border border-white/10 bg-[#0d1016]/90 shadow-xl shadow-black/20 backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}
