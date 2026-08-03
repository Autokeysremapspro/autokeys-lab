import type { InputHTMLAttributes } from 'react'

export default function AKInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-[#e2954d]/50 focus:ring-4 focus:ring-[#e2954d]/10 ${className}`}
    />
  )
}
