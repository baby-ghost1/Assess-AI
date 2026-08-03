import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Users, Shield, UserCheck, UserX, Search } from 'lucide-react'
import { EmptyState } from '@/components/shared'
import { useState } from 'react'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users${search ? `?search=${search}` : ''}`).then((r) => r.data),
  })

  const users = data?.data?.users || []

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary/10 p-3"><Users className="h-6 w-6 text-primary" /></div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Users</h2>
          <p className="text-sm text-text-secondary mt-1">Manage platform users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search users by name or email..." />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bg-tertiary rounded w-1/3" />
                  <div className="h-3 bg-bg-tertiary rounded w-1/2" />
                </div>
                <div className="h-6 w-16 rounded-full bg-bg-tertiary" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found"
          description={search ? 'No users match your search criteria' : 'No users registered yet'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-secondary border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-bg-secondary/50">
                    <td className="px-4 py-3 text-sm text-text-primary">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <UserCheck className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                          <UserX className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u._id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{u.email}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    u.role === 'admin' ? 'bg-primary/10 text-primary' : u.role === 'setter' ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-text-secondary'
                  }`}>
                    <Shield className="h-2.5 w-2.5" /> {u.role}
                  </span>
                </div>
                <div className="mt-2">
                  {u.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <UserCheck className="h-2.5 w-2.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                      <UserX className="h-2.5 w-2.5" /> Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
