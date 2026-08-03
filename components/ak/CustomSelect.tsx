'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type CustomSelectOption = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: CustomSelectOption[]
  className?: string
  placeholder?: string
  disabled?: boolean
}

// Sustituye al <select> nativo: el navegador pinta las opciones de un
// <select> con sus propios estilos (fondo blanco, letra negra) sin que el
// CSS del sitio pueda tocarlo, así que en un tema oscuro se nota mucho al
// abrirlo. Este componente se ve y se comporta igual (mismo value/onChange
// que un <select>) pero la lista de opciones la pintamos nosotros.
export default function CustomSelect({ value, onChange, options, className = '', placeholder = 'Seleccionar...', disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm outline-none transition disabled:opacity-50"
        style={{
          background: '#0b1220',
          borderColor: open ? '#dc2626' : 'rgba(255,255,255,.10)',
          color: selected ? '#f9fafb' : '#6b7280',
          boxShadow: open ? '0 0 0 4px rgba(220,38,38,.12)' : 'none',
        }}
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.15s', color: '#dc2626' }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border py-1 shadow-2xl"
          style={{ background: '#111827', borderColor: 'rgba(255,255,255,.10)' }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className="block w-full px-4 py-2.5 text-left text-sm transition"
              style={
                opt.value === value
                  ? { background: 'rgba(220,38,38,.14)', color: '#fca5a5', fontWeight: 700 }
                  : { color: '#e4e4e7' }
              }
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,.04)'
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
