import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Search, Ban, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserCheck, UserX,
  Trash2, RotateCcw, X, Minus, Check, Clock,
} from 'lucide-react'
import { RejectDialog, ConfirmDialog, CopyableText } from '@/components/shared'
import { useAppSelector } from '@/hooks'
import { notify, apiErrorMessage } from '@/lib/notify'

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
const formatDay = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })

function RowCheckbox({ checked, indeterminate = false, disabled = false, onChange, label }) {
  const state = checked || indeterminate ? 'border-primary bg-primary' : 'border-border bg-bg-primary hover:border-primary/60'
  return (
    <label className="flex h-5 w-5 items-center justify-center" title={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-150 peer-focus:ring-2 peer-focus:ring-primary/40 peer-disabled:cursor-not-allowed peer-disabled:opacity-40 ${state}`}>
        {checked ? <Check className="h-3 w-3 text-white" /> : indeterminate ? <Minus className="h-3 w-3 text-white" /> : null}
      </span>
    </label>
  )
}

function LastLoginCell({ user }) {
  if (!user.lastLoginAt) return <span className="text-xs text-text-tertiary">Never</span>
  return (
    <div className="leading-tight">
      <div className="text-xs text-text-secondary">
        {formatDate(user.lastLoginAt)}, {formatTime(user.lastLoginAt)}
      </div>
      <div className="text-[10px] text-text-tertiary">
        {formatDay(user.lastLoginAt)}
        {user.lastLoginLocation ? ` · ${user.lastLoginLocation}` : ''}
      </div>
    </div>
  )
}

function StatusCell({ user }) {
  if (user.deletedAt) {
    const graceExpired = user.graceExpiresAt && new Date(user.graceExpiresAt).getTime() < Date.now()
    return (
      <div className="flex flex-col items-start gap-1">
        <span
          className="flex items-center gap-1 text-xs text-danger"
          title={user.deletedReason ? `Reason: ${user.deletedReason}` : 'Deleted'}
        >
          <Trash2 className="h-3 w-3" /> {user.purgedAt ? 'Permanently deleted' : 'Deleted'}
        </span>
        {user.restoreRequestedAt && !user.purgedAt && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
            Restore requested
          </span>
        )}
        <span className="text-[10px] text-text-tertiary">
          {user.deletionType === 'self' ? 'Self-deleted' : 'By admin'} · {formatDate(user.deletedAt)}
        </span>
        {!user.purgedAt && user.graceExpiresAt && (
          <span
            className={`text-[10px] ${graceExpired ? 'text-danger' : 'text-amber-500'}`}
            title={`Data is permanently deleted after ${formatDate(user.graceExpiresAt)}`}
          >
            {graceExpired ? 'Purge pending' : `Auto-deletes ${formatDate(user.graceExpiresAt)}`}
          </span>
        )}
      </div>
    )
  }
  return user.isActive ? (
    <span className="flex items-center gap-1 text-xs text-success"><UserCheck className="h-3 w-3" /> Active</span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-danger"><UserX className="h-3 w-3" /> Inactive</span>
  )
}

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [bulkPurgeDialog, setBulkPurgeDialog] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const currentUserId = useAppSelector((s) => s.auth.user?._id)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: () => {
      const params = { search, role: roleFilter, page, limit: 20 }
      if (statusFilter === 'active' || statusFilter === 'deleted' || statusFilter === 'purged') params.status = statusFilter
      if (statusFilter === 'requested') params.restoreRequested = 'true'
      return api.get('/admin/users', { params }).then((r) => r.data)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      notify.success('User updated')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to update user')),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) => api.delete(`/admin/users/${id}`, { data: { reason } }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteDialog(null)
      setSelected((prev) => prev.filter((id) => id !== vars.id))
      notify.success('User deleted')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to delete user')),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids, reason }) => api.post('/admin/users/bulk-delete', { ids, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteDialog(null)
      setSelected([])
      notify.success(res?.data?.message || 'Users deleted')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to delete users')),
  })

  const bulkPurgeMutation = useMutation({
    mutationFn: ({ ids, reason }) => api.post('/admin/users/bulk-permanent-delete', { ids, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setBulkPurgeDialog(false)
      setSelected([])
      notify.success(res?.data?.message || 'Users permanently deleted')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to permanently delete users')),
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, updates }) => api.post('/admin/users/bulk-update', { ids, updates }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSelected([])
      notify.success(res?.data?.message || 'Users updated')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to update users')),
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setRestoreTarget(null)
      notify.success('Account restored')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to restore account')),
  })

  const purgeMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/permanent-delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setPurgeTarget(null)
      notify.success('User permanently deleted')
    },
    onError: (err) => notify.error(apiErrorMessage(err, 'Failed to permanently delete user')),
  })

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination

  const canSelect = (u) => String(u._id) !== String(currentUserId) && !u.deletedAt
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const selectableIds = users.filter(canSelect).map((u) => u._id)
  const allOnPageSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id))
  const someOnPageSelected = selectableIds.some((id) => selectedSet.has(id))

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) selectableIds.forEach((id) => next.delete(id))
      else selectableIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  const bulkSetActive = (isActive) => {
    if (selected.length === 0) return
    setConfirmAction({
      title: `${isActive ? 'Activate' : 'Deactivate'} ${selected.length} selected user(s)?`,
      message: isActive
        ? 'Selected accounts will be able to sign in again.'
        : 'Selected accounts will not be able to sign in until reactivated.',
      variant: isActive ? 'info' : 'danger',
      confirmLabel: isActive ? 'Activate' : 'Deactivate',
      onConfirm: () => bulkUpdateMutation.mutate({ ids: selected, updates: { isActive } }),
    })
  }

  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending

  return (
    <div className="space-y-4 -mx-2 sm:-mx-3">
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
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="purged">Permanently Deleted</option>
          <option value="requested">Restore Requested</option>
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
          <div className="hidden lg:block rounded-xl border border-border bg-bg-secondary overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 w-10">
                    <RowCheckbox
                      checked={allOnPageSelected}
                      indeterminate={!allOnPageSelected && someOnPageSelected}
                      disabled={selectableIds.length === 0}
                      onChange={toggleAllOnPage}
                      label="Select all users on this page"
                    />
                  </th>
                  <th className="py-4 pl-4 pr-2 font-medium text-text-secondary">Name</th>
                  <th className="py-4 pl-2 pr-4 font-medium text-text-secondary">Email</th>
                  <th className="p-4 font-medium text-text-secondary">Role</th>
                  <th className="p-4 font-medium text-text-secondary">Status</th>
                  <th className="p-4 font-medium text-text-secondary">Verified</th>
                  <th className="p-4 font-medium text-text-secondary">Approved</th>
                  <th className="p-4 font-medium text-text-secondary">Joined</th>
                  <th className="p-4 font-medium text-text-secondary">Last Login</th>
                  <th className="p-4 text-center font-medium text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const selectable = canSelect(user)
                  const isChecked = selectedSet.has(user._id)
                  return (
                    <tr key={user._id} className={`border-b border-border last:border-0 hover:bg-bg-tertiary/50 ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <RowCheckbox
                          checked={isChecked}
                          disabled={!selectable}
                          onChange={() => toggleOne(user._id)}
                          label={selectable ? `Select ${user.name}` : 'Not selectable'}
                        />
                      </td>
                      <td className="py-4 pl-4 pr-2 text-text-primary font-medium">
                        <CopyableText value={user.name} maxWidth="8.5rem" />
                      </td>
                      <td className="py-4 pl-2 pr-4 text-text-secondary">
                        <CopyableText value={user.email} maxWidth="8rem" />
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'admin' ? 'bg-primary/10 text-primary' :
                          user.role === 'setter' ? 'bg-accent/10 text-accent' :
                          'bg-bg-tertiary text-text-secondary'
                        }`}>
                          {user.role === 'setter' ? 'Setter' : user.role}
                        </span>
                      </td>
                      <td className="p-4"><StatusCell user={user} /></td>
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
                      <td className="p-4 text-text-secondary text-xs whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="p-4"><LastLoginCell user={user} /></td>
                      <td className="p-4">
                        {user.deletedAt ? (
                          <div className="flex items-center gap-2">
                            {!user.purgedAt && (
                              <button
                                onClick={() => setRestoreTarget(user)}
                                className="flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs text-success hover:bg-success/20 transition-colors"
                                title="Restore this account"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restore
                              </button>
                            )}
                            {!user.purgedAt && (
                              <button
                                onClick={() => setPurgeTarget(user)}
                                className="flex items-center gap-1 rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/20 transition-colors"
                                title="Delete permanently — erases all data, cannot be undone"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete forever
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmAction({
                                title: user.isActive ? 'Deactivate user?' : 'Activate user?',
                                message: user.isActive
                                  ? `"${user.name}" will not be able to sign in until reactivated.`
                                  : `"${user.name}" will be able to sign in again.`,
                                variant: user.isActive ? 'danger' : 'info',
                                confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
                                onConfirm: () => updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } }),
                              })}
                              className="rounded p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                              title="Toggle active status"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <select
                              value={user.role}
                              onChange={(e) => {
                                const nextRole = e.target.value
                                setConfirmAction({
                                  title: 'Change role?',
                                  message: `Change ${user.name}'s role to ${nextRole}?`,
                                  variant: 'warning',
                                  confirmLabel: 'Change role',
                                  onConfirm: () => updateMutation.mutate({ id: user._id, data: { role: nextRole } }),
                                })
                              }}
                              className="rounded border border-border bg-bg-primary px-2 py-1 text-xs text-text-primary focus:outline-none"
                            >
                              <option value="candidate">Candidate</option>
                              <option value="setter">Setter</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              disabled={String(user._id) === String(currentUserId)}
                              title={String(user._id) !== String(currentUserId) ? 'Delete user' : 'You cannot delete your own account'}
                              onClick={() => setDeleteDialog({ mode: 'single', user })}
                              className="rounded p-1.5 text-danger bg-danger/10 hover:bg-danger/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr><td colSpan="10" className="p-8 text-center text-text-secondary text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => {
              const selectable = canSelect(user)
              const isChecked = selectedSet.has(user._id)
              return (
                <div key={user._id} className={`rounded-xl border border-border bg-bg-secondary p-4 space-y-3 ${isChecked ? 'border-primary/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <RowCheckbox
                        checked={isChecked}
                        disabled={!selectable}
                        onChange={() => toggleOne(user._id)}
                        label={selectable ? `Select ${user.name}` : 'Not selectable'}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary"><CopyableText value={user.name} maxWidth="11rem" alwaysVisible /></p>
                      <p className="text-xs text-text-secondary mt-0.5"><CopyableText value={user.email} maxWidth="11rem" alwaysVisible /></p>
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
                    <StatusCell user={user} />
                    <span className={`font-medium px-2 py-0.5 rounded-full ${user.isEmailVerified ? 'text-success bg-success/10' : 'text-text-secondary bg-bg-tertiary'}`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                    <span className="text-text-tertiary">Joined {formatDate(user.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                    <Clock className="h-3 w-3 shrink-0" />
                    {user.lastLoginAt
                      ? `Last login ${formatDate(user.lastLoginAt)}, ${formatTime(user.lastLoginAt)} (${formatDay(user.lastLoginAt)})${user.lastLoginLocation ? ` · ${user.lastLoginLocation}` : ''}`
                      : 'Never signed in'}
                  </div>

                  {user.role === 'setter' && !user.deletedAt && (
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
                    {user.deletedAt ? (
                      <div className="flex items-center gap-2">
                        {!user.purgedAt && (
                          <button
                            onClick={() => setRestoreTarget(user)}
                            className="rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-xs text-success hover:bg-success/20 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3 inline mr-1" />
                            Restore
                          </button>
                        )}
                        {!user.purgedAt && (
                          <button
                            onClick={() => setPurgeTarget(user)}
                            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger hover:bg-danger/20 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 inline mr-1" />
                            Delete forever
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmAction({
                            title: user.isActive ? 'Deactivate user?' : 'Activate user?',
                            message: user.isActive
                              ? `"${user.name}" will not be able to sign in until reactivated.`
                              : `"${user.name}" will be able to sign in again.`,
                            variant: user.isActive ? 'danger' : 'info',
                            confirmLabel: user.isActive ? 'Deactivate' : 'Activate',
                            onConfirm: () => updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } }),
                          })}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
                        >
                          <Ban className="h-3 w-3 inline mr-1" />
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => {
                            const nextRole = e.target.value
                            setConfirmAction({
                              title: 'Change role?',
                              message: `Change ${user.name}'s role to ${nextRole}?`,
                              variant: 'warning',
                              confirmLabel: 'Change role',
                              onConfirm: () => updateMutation.mutate({ id: user._id, data: { role: nextRole } }),
                            })
                          }}
                          className="rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="setter">Setter</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          disabled={String(user._id) === String(currentUserId)}
                          title={String(user._id) !== String(currentUserId) ? 'Delete user' : 'You cannot delete your own account'}
                          onClick={() => setDeleteDialog({ mode: 'single', user })}
                          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger hover:bg-danger/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
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

      {/* Floating bulk-action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-bg-card px-4 py-3 shadow-2xl shadow-black/40">
          <span className="text-sm font-medium text-text-primary">{selected.length} selected</span>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <button
            onClick={() => setDeleteDialog({ mode: 'bulk' })}
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button
            onClick={() => setBulkPurgeDialog(true)}
            className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
            title="Permanently delete selected users — cannot be undone"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete forever
          </button>
          <button
            onClick={() => bulkSetActive(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5" /> Activate
          </button>
          <button
            onClick={() => bulkSetActive(false)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <UserX className="h-3.5 w-3.5" /> Deactivate
          </button>
          <button
            onClick={() => setSelected([])}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <RejectDialog
        open={!!deleteDialog}
        title={deleteDialog?.mode === 'bulk' ? `Delete ${selected.length} Users` : 'Delete User'}
        message={
          deleteDialog?.mode === 'bulk'
            ? `Delete ${selected.length} selected user(s)? Each account will be blocked and will see your reason when they try to sign in — they can request restoration from the login page. Data is kept for 7 days, after which it is permanently deleted.`
            : deleteDialog?.mode === 'single'
              ? `Delete "${deleteDialog.user.name}"? Their account will be blocked and they will see your reason when they try to sign in — they can request restoration from the login page. Data is kept for 7 days, after which it is permanently deleted.`
              : ''
        }
        placeholder="Reason for deletion (required)..."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        pendingLabel="Deleting..."
        onConfirm={(reason) => {
          if (deleteDialog?.mode === 'bulk') bulkDeleteMutation.mutate({ ids: selected, reason })
          else if (deleteDialog?.mode === 'single') deleteMutation.mutate({ id: deleteDialog.user._id, reason })
        }}
        onCancel={() => setDeleteDialog(null)}
        isPending={isDeleting}
      />

      <RejectDialog
        open={bulkPurgeDialog}
        title={`Permanently Delete ${selected.length} Users`}
        message={`This will permanently erase ${selected.length} selected user(s) and all of their data — attempts, submissions, notifications. This cannot be undone.`}
        placeholder="Reason for deletion (required)..."
        confirmLabel={bulkPurgeMutation.isPending ? 'Deleting...' : 'Delete forever'}
        pendingLabel="Deleting..."
        onConfirm={(reason) => { if (!bulkPurgeMutation.isPending) bulkPurgeMutation.mutate({ ids: selected, reason }) }}
        onCancel={() => setBulkPurgeDialog(false)}
        isPending={bulkPurgeMutation.isPending}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore Account"
        message={restoreTarget ? `Restore "${restoreTarget.name}"? They will be able to sign in again immediately and all of their data will be available.` : ''}
        confirmLabel={restoreMutation.isPending ? 'Restoring...' : 'Restore'}
        onConfirm={() => restoreMutation.mutate(restoreTarget._id)}
        onCancel={() => setRestoreTarget(null)}
        isPending={restoreMutation.isPending}
        variant="success"
      />

      <ConfirmDialog
        open={!!purgeTarget}
        title="Delete Permanently"
        message={purgeTarget ? `Permanently delete "${purgeTarget.name}"? All of their data — attempts, submissions, notifications — will be erased and the account cannot be restored. This cannot be undone.` : ''}
        confirmLabel={purgeMutation.isPending ? 'Deleting...' : 'Delete forever'}
        onConfirm={() => purgeMutation.mutate(purgeTarget._id)}
        onCancel={() => setPurgeTarget(null)}
        isPending={purgeMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        variant={confirmAction?.variant || 'warning'}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        onConfirm={() => { confirmAction?.onConfirm?.(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
