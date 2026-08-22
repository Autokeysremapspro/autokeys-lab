export type LabDonutSegment = { label: string; value: number; color: string }

export default function LabDonut({
  segments,
  centerLabel,
  centerValue,
  size = 168,
  thickness = 22,
}: {
  segments: LabDonutSegment[]
  centerLabel?: string
  centerValue?: string
  size?: number
  thickness?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total
    const dash = fraction * circumference
    const arc = { ...seg, dash, offset }
    offset += dash
    return arc
  })

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={thickness} />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue && <div className="text-2xl font-bold text-white">{centerValue}</div>}
            {centerLabel && <div className="mt-0.5 text-[11px] text-zinc-500">{centerLabel}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
