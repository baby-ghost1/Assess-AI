import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { updateProfile } from '@/features/auth/authSlice'
import { User, Mail, Shield, Calendar, Clock, Award, CheckCircle, Pencil, Loader2, AlertCircle } from 'lucide-react'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary"><Icon className="h-4 w-4 text-primary" /></div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  const role = user?.role || 'candidate'
  const roleLabels = { admin: 'Administrator', setter: 'Question Setter', candidate: 'Candidate' }

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleSave() {
    setError('')
    setSuccess('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!email.trim()) { setError('Email is required'); return }

    setLoading(true)
    try {
      await dispatch(updateProfile({ name: name.trim(), email: email.trim() })).unwrap()
      setSuccess('Profile updated successfully!')
      setEditing(false)
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setName(user?.name || '')
    setEmail(user?.email || '')
    setEditing(false)
    setError('')
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="rounded-xl border border-border bg-bg-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary text-3xl font-bold shrink-0">
            {initials}
          </div>
          <div className="text-center sm:text-left flex-1">
            {editing ? (
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Your name" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                  className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Your email" />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-heading font-bold text-text-primary">{user?.name}</h2>
                <p className="text-sm text-text-secondary mt-0.5">{roleLabels[role] || role}</p>
              </>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" /> Active</span>
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mt-4">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-500">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 pt-6">
          <InfoRow icon={User} label="Full Name" value={user?.name} />
          <InfoRow icon={Mail} label="Email" value={user?.email} />
          <InfoRow icon={Shield} label="Role" value={roleLabels[role] || role} />
          <InfoRow icon={Calendar} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
          <InfoRow icon={Clock} label="Last Login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
          <InfoRow icon={Award} label="User ID" value={user?._id?.slice(-8)?.toUpperCase() || '—'} />
        </div>

        {editing && (
          <div className="flex gap-3 pt-6 border-t border-border mt-6">
            <button onClick={handleCancel} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
