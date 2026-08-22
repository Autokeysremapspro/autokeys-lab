'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type CustomSelectOption = { value: string; label: string }
type Props = { value: string; onChange: (value: string) => void; options: CustomSelectOption[]; className?: string; placeholder?: string; disabled?: boolean }

export default function CustomSelect({ value, onChange, options, className = '', placeholder = 'Seleccionar...', disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${open ? 'z-[80]' : 'z-0'} ${className}`}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} className="flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-[14px] outline-none transition disabled:opacity-50" style={{ background:'#0d1015', borderColor:open?'rgba(239,32,45,.6)':'rgba(255,255,255,.10)', color:selected?'#f9fafb':'#6b7280', boxShadow:open?'0 0 0 4px rgba(239,32,45,.08)':'none' }}>
        <span className="truncate pr-3">{selected?.label || placeholder}</span>
        <ChevronDown size={17} className="shrink-0" style={{ transform:open?'rotate(180deg)':'none', transition:'.15s', color:'#ef202d' }} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[90] mt-2 max-h-72 overflow-auto rounded-xl border py-1.5 shadow-[0_24px_70px_rgba(0,0,0,.62)]" style={{ background:'#0d1015', borderColor:'rgba(255,255,255,.11)' }}>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }} className="block min-h-[42px] w-full px-4 py-2.5 text-left text-[13px] transition hover:bg-white/[0.045]" style={opt.value===value?{background:'rgba(239,32,45,.13)',color:'#ff8c94',fontWeight:700}:{color:'#e4e4e7'}}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
