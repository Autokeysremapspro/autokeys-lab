import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

export default function AKButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  const variants: Record<Variant, string> = {
    primary: 'border-[#c81f2a]/30 bg-[#c81f2a] text-[#0a0d12] hover:bg-[#ff5468] shadow-lg shadow-[#7a0f16]/30',
    secondary: 'border-white/10 bg-white/[0.05] text-zinc-100 hover:bg-white/[0.09]',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    ghost: 'border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white',
  }

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
