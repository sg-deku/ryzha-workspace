interface SparklineProps {
  data: number[]
  className?: string
  height?: number
  color?: string
  lastColor?: string
}

export function Sparkline({
  data,
  className = "",
  height = 24,
  color = "bg-primary/20",
  lastColor = "bg-primary",
}: SparklineProps) {
  const max = Math.max(...data, 1)
  return (
    <div
      className={`flex items-end gap-px ${className}`}
      style={{ height }}
      aria-hidden
    >
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-[2px] transition-all ${i === data.length - 1 ? lastColor : color}`}
          style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  )
}

export function MiniLineChart({
  data,
  width = 80,
  height = 32,
  strokeColor = "hsl(221.2 83.2% 53.3%)",
  fillColor = "rgba(59,130,246,0.08)",
}: {
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  fillColor?: string
}) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + ((max - v) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = points.join(" ")
  const areaClose = `${points[points.length - 1].split(",")[0]},${height} ${points[0].split(",")[0]},${height}`
  const area = `${polyline} ${areaClose}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polygon points={area} fill={fillColor} />
      <polyline points={polyline} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
