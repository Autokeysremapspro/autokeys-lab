export default function LabLineChart({
  points,
  labels,
  color = '#ff3b46',
  height = 180,
  formatY = (v: number) => String(v),
}: {
  points: number[]
  labels: string[]
  color?: string
  height?: number
  formatY?: (v: number) => string
}) {
  if (!points.length) return <div className="grid h-full place-items-center text-sm text-zinc-600">Sin datos</div>

  const width = 600
  const padLeft = 46
  const padBottom = 22
  const max = Math.max(...points, 1)
  const steps = 4
  const gridValues = Array.from({ length: steps + 1 }, (_, i) => Math.round((max / steps) * i))

  const plotW = width - padLeft
  const plotH = height - padBottom

  const coords = points.map((v, i) => {
    const x = padLeft + (i / Math.max(points.length - 1, 1)) * plotW
    const y = plotH - (v / max) * plotH
    return { x, y, v }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${plotH} L ${coords[0].x} ${plotH} Z`

  const labelStep = Math.max(1, Math.ceil(labels.length / 12))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="labLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridValues.map((gv, i) => {
        const y = plotH - (gv / max) * plotH
        return (
          <g key={i}>
            <line x1={padLeft} x2={width} y1={y} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
            <text x={0} y={y + 4} fontSize="10" fill="#6b7280">{formatY(gv)}</text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#labLineFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} stroke="#07080b" strokeWidth="1.5" />
      ))}

      {labels.map((label, i) => {
        if (i % labelStep !== 0 && i !== labels.length - 1) return null
        const x = padLeft + (i / Math.max(points.length - 1, 1)) * plotW
        return (
          <text key={i} x={x} y={height - 4} fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
        )
      })}
    </svg>
  )
}
