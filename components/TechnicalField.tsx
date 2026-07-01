'use client'

type Props = {
  label: string
  value?: string | number | null
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  textarea?: boolean
}

export default function TechnicalField({ label, value, onChange, placeholder, type = 'text', textarea }: Props) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-zinc-400">{label}</span>
      {textarea ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
      )}
    </label>
  )
}
