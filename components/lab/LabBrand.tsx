export function LabLogoMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center font-black italic leading-none tracking-[-0.16em] text-[#ef202d]"
      style={{ height: size, minWidth: size * 1.25, fontSize: size * 0.78 }}
      aria-label="AK"
    >
      AK
    </div>
  )
}

export function LabProBadge({ size = 46 }: { size?: number }) {
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ height: size, width: size }} title="AK PRO">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="labProFill" x1="7" y1="5" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#17191d" />
            <stop offset="1" stopColor="#090a0d" />
          </linearGradient>
          <linearGradient id="labProStroke" x1="8" y1="7" x2="39" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f4a62a" />
            <stop offset=".48" stopColor="#ff542f" />
            <stop offset="1" stopColor="#7c1519" />
          </linearGradient>
        </defs>
        <path d="M24 3.5 41 10v13.2c0 10.1-7.1 17.2-17 21.3C14.1 40.4 7 33.3 7 23.2V10Z" fill="url(#labProFill)" stroke="url(#labProStroke)" strokeWidth="1.8" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
        <span className="text-[11px] font-black leading-none text-white">AK</span>
        <span className="mt-0.5 text-[5px] font-black tracking-[.08em] text-[#ff9a34]">PRO</span>
      </div>
    </div>
  )
}

export function LabWordmark({ subtitle = 'By Autokeys Remaps Pro' }: { subtitle?: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[21px] font-bold leading-[1.05] tracking-[-0.025em] text-white">Autokeys Lab</div>
      <div className="mt-1 truncate text-[10px] font-medium leading-none text-zinc-400">{subtitle}</div>
    </div>
  )
}
