import { useEffect, useRef, useState } from 'react'

function AnimatedNumber({ value, duration = 1200, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const end = typeof value === 'number' ? value : parseFloat(value) || 0
    if (end === 0) { setDisplay(0); return }
    const startTime = performance.now()
    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(end * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{display}{suffix}</>
}

export default function StatCard({ icon: Icon, label, value, sub, color }) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  const suffix = typeof value === 'string' ? value.replace(/[\d.]/g, '') : ''
  const isNumeric = !isNaN(numericValue) && numericValue !== null && numericValue !== undefined

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">
            {isNumeric ? <AnimatedNumber value={numericValue} suffix={suffix} /> : value}
          </p>
          {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
