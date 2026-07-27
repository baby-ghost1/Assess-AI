import { useAppSelector, useAppDispatch } from '@/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toggleTheme } from '@/store/themeSlice'
import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Shield, Bell, Palette, Lock, Globe, Moon, Sun, CheckCircle, Eye, EyeOff, X, AlertCircle, LogOut, Loader2 } from 'lucide-react'
import { changePassword } from '@/features/auth/authSlice'
import { logout } from '@/features/auth/authSlice'

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
]

function SkeletonSettings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse">
        <div className="h-7 bg-bg-tertiary rounded w-32 mb-2" />
        <div className="h-4 bg-bg-tertiary rounded w-48" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-bg-tertiary rounded-lg w-24" />)}
      </div>
      <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse space-y-4">
        <div className="h-5 bg-bg-tertiary rounded w-24" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-bg-tertiary" />
          <div className="space-y-2"><div className="h-4 bg-bg-tertiary rounded w-32" /><div className="h-3 bg-bg-tertiary rounded w-48" /></div>
        </div>
      </div>
    </div>
  )
}

function AccountTab({ user }) {
  const role = user?.role || 'candidate'
  const roleLabels = { admin: 'Administrator', setter: 'Question Setter', candidate: 'Candidate' }
  const roleColors = { admin: 'bg-danger/10 text-danger', setter: 'bg-accent/10 text-accent', candidate: 'bg-primary/10 text-primary' }
  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-heading font-bold text-primary shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-heading font-semibold text-text-primary">{user?.name}</h3>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            <span className={`inline-flex items-center mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[role]}`}>
              {roleLabels[role]}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Account Details
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: roleLabels[role] },
            { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">{item.label}</span>
              <span className="text-sm font-medium text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AppearanceTab() {
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector((s) => s.theme)

  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { id: 'light', label: 'Light', icon: Sun, desc: 'Bright and clear' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { if (mode !== t.id) dispatch(toggleTheme()) }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 ${
                mode === t.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-bg-tertiary/50'
              }`}
            >
              <div className={`rounded-lg p-2.5 ${mode === t.id ? 'bg-primary/15 text-primary' : 'bg-bg-tertiary text-text-secondary'}`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">{t.label}</p>
                <p className="text-xs text-text-secondary">{t.desc}</p>
              </div>
              {mode === t.id && (
                <div className="rounded-full bg-primary p-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const NOTIFICATION_KEYS = [
  { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive updates via email' },
  { key: 'assessmentReminders', label: 'Assessment reminders', desc: 'Get reminded about upcoming assessments' },
  { key: 'resultAlerts', label: 'Result alerts', desc: 'Notify when results are published' },
  { key: 'passwordAlerts', label: 'Security alerts', desc: 'Get notified about password changes and security events' },
]

function NotificationsTab() {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: prefsData } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => api.get('/auth/preferences').then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (prefs) => api.patch('/auth/preferences', prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    },
  })

  const prefs = prefsData?.data || { emailNotifications: true, assessmentReminders: true, resultAlerts: true, passwordAlerts: true }

  const toggle = (key) => {
    updateMutation.mutate({ ...prefs, [key]: !prefs[key] })
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Notification Preferences
        </h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <div className="space-y-1">
        {NOTIFICATION_KEYS.map((item) => (
          <label key={item.key} className="flex items-center justify-between py-3 cursor-pointer border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
            <button type="button" onClick={() => toggle(item.key)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${prefs[item.key] ? 'bg-primary' : 'bg-bg-tertiary border border-border'}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${prefs[item.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}

function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (password.length >= 14) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (score <= 2) return { label: 'Weak', color: '#EF4444', segments: 1 }
  if (score <= 3) return { label: 'Fair', color: '#F59E0B', segments: 2 }
  if (score <= 4) return { label: 'Moderate', color: '#F59E0B', segments: 3 }
  return { label: 'Strong', color: '#22C55E', segments: 4 }
}

function ChangePasswordModal({ open, onClose }) {
  const dispatch = useAppDispatch()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const strength = getPasswordStrength(newPassword)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const isEmpty = !oldPassword || !newPassword || !confirmPassword

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Enter' && !isEmpty && !loading) document.getElementById('change-pw-btn')?.click() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, isEmpty, loading])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (isEmpty) { setError('Please fill in all fields'); return }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (oldPassword === newPassword) { setError('New password must be different from current password'); return }

    setLoading(true)
    try {
      await dispatch(changePassword({ oldPassword, newPassword })).unwrap()
      setSuccess('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { onClose(); setSuccess('') }, 1500)
    } catch (err) {
      setError(err || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">Change Password</h3>
        <p className="text-sm text-text-secondary mb-5">Update your password to keep your account secure.</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-500">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" placeholder="Enter current password" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" placeholder="Enter new password" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= strength.segments ? strength.color : '#27272A' }} />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strength.color }}>Password strength: {strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border bg-bg-secondary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${confirmPassword && !passwordsMatch ? 'border-red-500' : confirmPassword && passwordsMatch ? 'border-emerald-500' : 'border-border'}`} placeholder="Confirm new password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            {confirmPassword && passwordsMatch && <p className="text-xs text-emerald-500 mt-1">Passwords match</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">Cancel</button>
            <button id="change-pw-btn" type="submit" disabled={loading || isEmpty}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SecurityTab({ onChangePassword }) {
  const dispatch = useAppDispatch()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Password
        </h3>
        <p className="text-sm text-text-secondary mb-4">Manage your password and account security.</p>
        <button onClick={onChangePassword} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          Change Password
        </button>
      </div>

      <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
        <h3 className="text-sm font-heading font-semibold text-danger mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Danger Zone
        </h3>
        <p className="text-sm text-text-secondary mb-4">Irreversible actions for your account.</p>
        <div className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Sign out</p>
            <p className="text-xs text-text-secondary">Sign out from your account on this device</p>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-1.5">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-danger/10 p-2"><LogOut className="h-5 w-5 text-danger" /></div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-text-primary">Sign out?</h3>
                <p className="text-sm text-text-secondary">You'll need to sign in again to access your account.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">Cancel</button>
              <button onClick={() => dispatch(logout())} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SystemTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5 animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1.5"><div className="h-3 bg-bg-tertiary rounded w-32" /><div className="h-2 bg-bg-tertiary rounded w-48" /></div>
            <div className="h-5 bg-bg-tertiary rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
        <AlertCircle className="h-8 w-8 text-danger mx-auto mb-3" />
        <p className="text-text-primary font-medium">Failed to load settings</p>
        <p className="text-sm text-text-secondary mt-1">{error?.message || 'Something went wrong'}</p>
      </div>
    )
  }

  const settings = data?.data || []
  const categories = [...new Set(settings.map((s) => s.category))]

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
        <SettingsIcon className="h-8 w-8 text-text-secondary mx-auto mb-3 opacity-40" />
        <p className="text-text-primary font-medium">No system settings configured</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat} className="rounded-xl border border-border bg-bg-card p-5">
          <h4 className="text-sm font-heading font-semibold text-text-primary capitalize mb-3">{cat}</h4>
          {settings.filter((s) => s.category === cat).map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm text-text-primary capitalize">{s.key.replace(/_/g, ' ')}</p>
                {s.description && <p className="text-xs text-text-secondary">{s.description}</p>}
              </div>
              <span className="text-xs text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded ml-3 shrink-0">{String(s.value)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAppSelector((s) => s.auth)
  const role = user?.role || 'candidate'
  const roleLabels = { admin: 'Administrator', setter: 'Question Setter', candidate: 'Candidate' }
  const [activeTab, setActiveTab] = useState('account')
  const [showChangePassword, setShowChangePassword] = useState(false)

  const allTabs = role === 'admin'
    ? [...TABS, { id: 'system', label: 'System', icon: Globe }]
    : TABS

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Gradient Header */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3"><SettingsIcon className="h-6 w-6 text-primary" /></div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Settings</h2>
            <p className="text-sm text-text-secondary mt-1">{roleLabels[role]} preferences and configuration</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex rounded-full border border-border bg-bg-card p-1">
        {allTabs.map((t, i) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 z-10 ${
                isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary shadow-sm" />
              )}
              <span className="relative flex items-center gap-2">
                <t.icon className="h-4 w-4" />
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && <AccountTab user={user} />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'security' && <SecurityTab onChangePassword={() => setShowChangePassword(true)} />}
      {activeTab === 'system' && role === 'admin' && <SystemTab />}

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  )
}
