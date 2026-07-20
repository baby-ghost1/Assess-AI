import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input({ className, label, error, icon, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{icon}</div>}
        <input ref={ref}
          className={cn('w-full rounded-lg border border-border bg-bg-secondary py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200', icon && 'pl-10', error && 'border-danger focus:ring-danger', className)} {...props} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})
