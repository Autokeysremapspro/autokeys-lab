import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

export default function AKButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  const variants: Record<Variant, string> = {
    primary: 'border-red-500/30 bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-950/30',
    secondary: 'border-white/10 bg-white/[0.05] text-zinc-100 hover:bg-white/[0.09]',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    ghost: 'border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white',
  }

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
