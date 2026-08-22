export function LabLogoMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1a1b20] to-[#0a0a0c] ring-1 ring-white/10"
      style={{ height: size, width: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
        <path d="M4 27 L13 5 H17.5 L26.5 27 H21.8 L20 22.5 H11L9.2 27 Z M12.6 18.5H19L15.8 10.4Z" fill="#ff2d3d" />
      </svg>
    </div>
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
