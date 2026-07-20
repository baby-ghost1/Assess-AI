import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-bg-tertiary', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
