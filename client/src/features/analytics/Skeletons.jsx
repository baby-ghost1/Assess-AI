export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-bg-card p-5 animate-pulse ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-bg-tertiary" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-bg-tertiary rounded w-20" />
          <div className="h-6 bg-bg-tertiary rounded w-14" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-bg-card p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-bg-tertiary rounded w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-2 bg-bg-tertiary rounded-full" />
        <div className="h-2 bg-bg-tertiary rounded-full w-4/5" />
        <div className="h-2 bg-bg-tertiary rounded-full w-3/5" />
        <div className="h-2 bg-bg-tertiary rounded-full w-2/3" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-bg-card p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-bg-tertiary rounded w-36 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 bg-bg-tertiary rounded flex-1" />
            <div className="h-3 bg-bg-tertiary rounded flex-1" />
            <div className="h-3 bg-bg-tertiary rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
