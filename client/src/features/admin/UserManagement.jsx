import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Search, Shield, Ban, Check, X, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
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
        <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
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
                      <span className="flex items-center gap-1 text-xs text-success"><Check className="h-3 w-3" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-danger"><X className="h-3 w-3" /> Inactive</span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.isEmailVerified ? (
                      <span className="text-xs text-success">Yes</span>
                    ) : (
                      <span className="text-xs text-text-secondary">No</span>
                    )}
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
