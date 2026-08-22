export default function LabSparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  if (!values.length) return null
  const width = 100
  const height = 28
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  const color = positive ? '#4ade95' : '#ff5468'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  )
}
