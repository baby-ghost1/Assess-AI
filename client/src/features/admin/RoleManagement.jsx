import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Shield, Check } from 'lucide-react'

function RoleCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-bg-tertiary" />
        <div className="space-y-1.5">
          <div className="h-4 bg-bg-tertiary rounded w-24" />
          <div className="h-3 bg-bg-tertiary rounded w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-6 w-20 rounded-full bg-bg-tertiary" />)}
      </div>
    </div>
  )
}

export default function RoleManagement() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <RoleCardSkeleton key={i} />)}
      </div>
    )
  }

  const roles = data?.data || []

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.name} className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`rounded-lg p-2 ${
              role.name === 'super_admin' ? 'bg-danger/10 text-danger' :
              role.name === 'admin' ? 'bg-primary/10 text-primary' :
              role.name === 'reviewer' ? 'bg-accent/10 text-accent' :
              'bg-bg-tertiary text-text-secondary'
            }`}>
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">{role.label}</h3>
              <p className="text-xs text-text-secondary">{role.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role.permissions.map((perm) => (
              <span key={perm} className="inline-flex items-center gap-1 rounded-full bg-bg-tertiary px-3 py-1 text-xs text-text-primary">
                <Check className="h-3 w-3 text-success" /> {perm.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
