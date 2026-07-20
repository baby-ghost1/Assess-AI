import { useAppSelector } from '@/hooks'
import { User, Mail, Shield, Calendar, Clock, CheckCircle, Award } from 'lucide-react'

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
  const role = user?.role || 'candidate'
  const roleLabels = { admin: 'Administrator', setter: 'Question Setter', candidate: 'Candidate' }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="rounded-xl border border-border bg-bg-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary text-3xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-heading font-bold text-text-primary">{user?.name}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{roleLabels[role] || role}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" /> Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 pt-6">
          <InfoRow icon={User} label="Full Name" value={user?.name} />
          <InfoRow icon={Mail} label="Email" value={user?.email} />
          <InfoRow icon={Shield} label="Role" value={roleLabels[role] || role} />
          <InfoRow icon={Calendar} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
          <InfoRow icon={Clock} label="Last Login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
          <InfoRow icon={Award} label="User ID" value={user?._id?.slice(-8)?.toUpperCase() || '—'} />
        </div>
      </div>
    </div>
  )
}
