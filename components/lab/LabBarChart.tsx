export type LabBarSeries = { label: string; color: string; values: number[] }

export default function LabBarChart({
  series,
  labels,
  height = 180,
  formatY = (v: number) => String(v),
}: {
  series: LabBarSeries[]
  labels: string[]
  height?: number
  formatY?: (v: number) => string
}) {
  const width = 600
  const padLeft = 46
  const padBottom = 22
  const plotW = width - padLeft
  const plotH = height - padBottom

  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const steps = 4
  const gridValues = Array.from({ length: steps + 1 }, (_, i) => Math.round((max / steps) * i))

  const groupCount = labels.length || 1
  const groupWidth = plotW / groupCount
  const barGap = 2
  const barWidth = Math.max(1, (groupWidth - barGap * (series.length + 1)) / series.length)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      {gridValues.map((gv, i) => {
        const y = plotH - (gv / max) * plotH
        return (
          <g key={i}>
            <line x1={padLeft} x2={width} y1={y} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
            <text x={0} y={y + 4} fontSize="10" fill="#6b7280">{formatY(gv)}</text>
          </g>
        )
      })}

      {labels.map((_, groupIndex) => {
        const groupX = padLeft + groupIndex * groupWidth
        return series.map((s, seriesIndex) => {
          const v = s.values[groupIndex] || 0
          const barH = (v / max) * plotH
          const x = groupX + barGap + seriesIndex * (barWidth + barGap)
          const y = plotH - barH
          return <rect key={`${groupIndex}-${seriesIndex}`} x={x} y={y} width={barWidth} height={barH} rx="1.5" fill={s.color} opacity="0.9" />
        })
      })}

      {labels.map((label, i) => {
        const labelStep = Math.max(1, Math.ceil(labels.length / 12))
        if (i % labelStep !== 0 && i !== labels.length - 1) return null
        const x = padLeft + i * groupWidth + groupWidth / 2
        return (
          <text key={i} x={x} y={height - 4} fontSize="10" fill="#6b7280" textAnchor="middle">{label}</text>
        )
      })}
    </svg>
  )
}
