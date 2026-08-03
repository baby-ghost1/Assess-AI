import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Search, Ban, X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Shield, UserCheck, UserX } from 'lucide-react'
import { notify } from '@/lib/notify'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () => api.get('/admin/users', { params: { search, role: roleFilter, page, limit: 15 } }).then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      notify.success('User updated')
    },
  })

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="candidate">Candidate</option>
          <option value="setter">Setter</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-secondary p-4 animate-pulse">
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
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-xl border border-border bg-bg-secondary overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-text-secondary">Name</th>
                  <th className="p-4 font-medium text-text-secondary">Email</th>
                  <th className="p-4 font-medium text-text-secondary">Role</th>
                  <th className="p-4 font-medium text-text-secondary">Status</th>
                  <th className="p-4 font-medium text-text-secondary">Verified</th>
                  <th className="p-4 font-medium text-text-secondary">Approved</th>
                  <th className="p-4 font-medium text-text-secondary">Joined</th>
                  <th className="p-4 font-medium text-text-secondary" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-border last:border-0 hover:bg-bg-tertiary/50">
                    <td className="p-4 text-text-primary font-medium">{user.name}</td>
                    <td className="p-4 text-text-secondary">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' :
                        user.role === 'setter' ? 'bg-accent/10 text-accent' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {user.role === 'setter' ? 'Setter' : user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-success"><UserCheck className="h-3 w-3" /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-danger"><UserX className="h-3 w-3" /> Inactive</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs ${user.isEmailVerified ? 'text-success' : 'text-text-secondary'}`}>
                        {user.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.role === 'setter' ? (
                        user.isApproved ? (
                          <button
                            onClick={() => updateMutation.mutate({ id: user._id, data: { isApproved: false } })}
                            className="flex items-center gap-1 text-xs text-success hover:text-danger transition-colors cursor-pointer"
                            title="Click to revoke approval"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approved
                          </button>
                        ) : (
                          <button
                            onClick={() => updateMutation.mutate({ id: user._id, data: { isApproved: true } })}
                            className="flex items-center gap-1 text-xs text-text-secondary hover:text-success transition-colors cursor-pointer"
                            title="Click to approve"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Pending
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="p-4 text-text-secondary text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const confirmed = window.confirm(`Toggle active status for ${user.name}?`)
                            if (confirmed) updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } })
                          }}
                          className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                          title="Toggle active status"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => {
                            const confirmed = window.confirm(`Change ${user.name}'s role to ${e.target.value}?`)
                            if (confirmed) updateMutation.mutate({ id: user._id, data: { role: e.target.value } })
                          }}
                          className="rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:outline-none"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="setter">Setter</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="8" className="p-8 text-center text-text-secondary text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => (
              <div key={user._id} className="rounded-xl border border-border bg-bg-secondary p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{user.email}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    user.role === 'admin' ? 'bg-primary/10 text-primary' :
                    user.role === 'setter' ? 'bg-accent/10 text-accent' :
                    'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <UserCheck className="h-2.5 w-2.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full">
                      <UserX className="h-2.5 w-2.5" /> Inactive
                    </span>
                  )}
                  <span className={`font-medium px-2 py-0.5 rounded-full ${user.isEmailVerified ? 'text-success bg-success/10' : 'text-text-secondary bg-bg-tertiary'}`}>
                    {user.isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className="text-text-tertiary">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                {user.role === 'setter' && (
                  <div className="flex items-center gap-2">
                    {user.isApproved ? (
                      <button
                        onClick={() => updateMutation.mutate({ id: user._id, data: { isApproved: false } })}
                        className="flex items-center gap-1 text-[10px] font-medium text-success hover:text-danger transition-colors cursor-pointer"
                      >
                        <CheckCircle className="h-3 w-3" /> Approved — tap to revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => updateMutation.mutate({ id: user._id, data: { isApproved: true } })}
                        className="flex items-center gap-1 text-[10px] font-medium text-text-secondary hover:text-success transition-colors cursor-pointer"
                      >
                        <XCircle className="h-3 w-3" /> Pending — tap to approve
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(`Toggle active status for ${user.name}?`)
                      if (confirmed) updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } })
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <Ban className="h-3 w-3 inline mr-1" />
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <select
                    value={user.role}
                    onChange={(e) => {
                      const confirmed = window.confirm(`Change ${user.name}'s role to ${e.target.value}?`)
                      if (confirmed) updateMutation.mutate({ id: user._id, data: { role: e.target.value } })
                    }}
                    className="rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="setter">Setter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-8 text-center text-text-secondary text-sm">No users found</div>
            )}
          </div>
        </>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border p-2 text-text-secondary hover:bg-bg-tertiary disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border p-2 text-text-secondary hover:bg-bg-tertiary disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
