export default function DonutChart({ data, size = 160, thickness = 24 }) {
  if (!data || data.length === 0) return null

  const total = data.reduce((a, b) => a + b.value, 0)
  if (total === 0) return null

  const radius = (size - thickness) / 2
  const circ = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  let cumulative = 0

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {data.map((item, i) => {
            const pct = (item.value / total) * 100
            const dashLen = (pct / 100) * circ
            const offset = circ - (cumulative / total) * circ
            cumulative += item.value
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={`${dashLen} ${circ - dashLen}`}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-heading font-bold text-text-primary">{total}</span>
          <span className="text-[10px] text-text-secondary">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-text-primary capitalize">{item.label}</span>
            <span className="text-sm text-text-secondary ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
