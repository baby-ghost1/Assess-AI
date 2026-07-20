import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Users, Shield, UserCheck, UserX, Search } from 'lucide-react'
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
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-12 text-center">
          <Users className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No users found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
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
      )}
    </div>
  )
}
