import { useAppSelector } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useDispatch } from 'react-redux'
import { toggleTheme } from '@/store/themeSlice'
import { useState } from 'react'
import { Loader2, Settings as SettingsIcon, User, Shield, Bell, Palette, Lock, Globe, Moon, Sun, CheckCircle, Eye, EyeOff, X, AlertCircle } from 'lucide-react'
import { changePassword } from '@/features/auth/authSlice'


function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</h3>
      {children}
    </div>
  )
}

function ThemeToggle() {
  const dispatch = useDispatch()
  const { mode } = useAppSelector((s) => s.theme)
  return (
    <button onClick={() => dispatch(toggleTheme())} className="flex items-center justify-between w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary hover:bg-bg-tertiary transition-colors">
      <span className="flex items-center gap-2">{mode === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</span>
      <span className="text-xs text-text-secondary capitalize bg-bg-tertiary px-2 py-0.5 rounded">{mode} mode</span>
    </button>
  )
}

function NotificationPrefs() {
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    assessmentReminders: true,
    resultAlerts: true,
    passwordAlerts: true,
  })
  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-3">
      {[
        { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive updates via email' },
        { key: 'assessmentReminders', label: 'Assessment reminders', desc: 'Get reminded about upcoming assessments' },
        { key: 'resultAlerts', label: 'Result alerts', desc: 'Notify when results are published' },
        { key: 'passwordAlerts', label: 'Security alerts', desc: 'Get notified about password changes and security events' },
      ].map((item) => (
        <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer">
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
  )
}

function AdminSystemSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  })

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />

  const settings = data?.data || []
  const categories = [...new Set(settings.map((s) => s.category))]

  if (categories.length === 0) {
    return <p className="text-sm text-text-secondary">No system settings configured</p>
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-sm font-medium text-text-secondary capitalize mb-2">{cat}</h4>
          {settings.filter((s) => s.category === cat).map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm text-text-primary">{s.label || s.key}</p>
                {s.description && <p className="text-xs text-text-secondary">{s.description}</p>}
              </div>
              <span className="text-xs text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded">{String(s.value)}</span>
            </div>
          ))}
        </div>
      ))}
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
  const dispatch = useDispatch()
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
  const passwordsDiffer = oldPassword && newPassword && oldPassword === newPassword
  const isEmpty = !oldPassword || !newPassword || !confirmPassword

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
            {oldPassword && newPassword && oldPassword === newPassword && (
              <p className="text-xs text-red-500 mt-1">New password must be different from current password</p>
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
            <button type="submit" disabled={loading || isEmpty}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAppSelector((s) => s.auth)
  const role = user?.role || 'candidate'
  const roleLabels = { admin: 'Administrator', setter: 'Question Setter', candidate: 'Candidate' }
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary/10 p-3"><SettingsIcon className="h-6 w-6 text-primary" /></div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Settings</h2>
          <p className="text-sm text-text-secondary mt-1">{roleLabels[role]} preferences and configuration</p>
        </div>
      </div>

      <Section title="Account" icon={User}>
        <div className="space-y-1 text-sm text-text-primary">
          <p><span className="text-text-secondary">Name:</span> {user?.name}</p>
          <p><span className="text-text-secondary">Email:</span> {user?.email}</p>
          <p><span className="text-text-secondary">Role:</span> {roleLabels[role]}</p>
        </div>
      </Section>

      <Section title="Appearance" icon={Palette}>
        <ThemeToggle />
      </Section>

      <Section title="Notifications" icon={Bell}>
        <NotificationPrefs />
      </Section>

      <Section title="Security" icon={Lock}>
        <p className="text-sm text-text-secondary mb-3">Manage your password and account security.</p>
        <button onClick={() => setShowChangePassword(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          Change Password
        </button>
      </Section>

      {role === 'admin' && (
        <Section title="System Configuration" icon={Globe}>
          <AdminSystemSettings />
        </Section>
      )}

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  )
}
