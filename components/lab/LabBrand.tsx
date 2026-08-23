export function LabLogoMark({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-ak-core.png"
      alt="AK Core — Autokeys Remaps Pro"
      className="shrink-0 object-contain"
      style={{ height: size, width: 'auto' }}
    />
  )
}

export function LabProBadge({ size = 46 }: { size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ height: size, width: size }}
      title="AK PRO"
    >
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="labProGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="100%" stopColor="#7a0f16" />
          </linearGradient>
        </defs>
        <path
          d="M24 3 L42 10 V23 C42 33.5 34.6 40.7 24 45 C13.4 40.7 6 33.5 6 23 V10 Z"
          fill="url(#labProGrad)"
          stroke="rgba(255,255,255,.25)"
          strokeWidth="1"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[11px] font-black leading-none tracking-tight text-white">AK</span>
      </div>
    </div>
  )
}

export function LabWordmark({ subtitle = 'By Autokeys Remaps Pro' }: { subtitle?: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xl font-bold leading-tight tracking-tight text-white">Autokeys Lab</div>
      <div className="truncate text-[11px] font-medium text-zinc-500">{subtitle}</div>
    </div>
  )
}
