import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Shield, ShieldAlert, AlertTriangle, Search, Users, Clock, Activity, FileSearch } from 'lucide-react'
import { TableSkeleton } from '@/components/shared'

const severityColors = {
  low: { chip: 'bg-blue-500/10 text-blue-400', bar: 'bg-blue-500', icon: 'bg-blue-500/10 text-blue-400' },
  medium: { chip: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500', icon: 'bg-amber-500/10 text-amber-400' },
  high: { chip: 'bg-red-500/10 text-red-400', bar: 'bg-red-500', icon: 'bg-red-500/10 text-red-400' },
}
const fallbackSeverity = { chip: 'bg-bg-tertiary text-text-secondary', bar: 'bg-border', icon: 'bg-bg-tertiary text-text-secondary' }

const violationLabels = {
  tab_switch: 'Tab Switch',
  multiple_faces: 'Multiple Faces',
  no_face: 'No Face',
  phone_detected: 'Phone Detected',
  looking_away: 'Looking Away',
  background_noise: 'Background Noise',
  clipboard_usage: 'Clipboard Usage',
  keyboard_shortcut: 'Keyboard Shortcut',
  network_disconnect: 'Network Disconnect',
  fullscreen_exit: 'Fullscreen Exit',
  copy_paste: 'Copy/Paste',
  right_click: 'Right Click',
  face_not_centered: 'Face Not Centered',
  low_lighting: 'Low Lighting',
  face_outside_screen: 'Face Outside Screen',
  posture_violation: 'Posture Violation',
}

function formatRelative(value) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs sm:text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SeverityChip({ severity }) {
  const s = severityColors[severity] || fallbackSeverity
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${s.chip}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity || 'unknown'}
    </span>
  )
}

export default function ProctoringDashboard() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const user = useAppSelector((s) => s.auth.user)
  const navigate = useNavigate()

  // Role guard — route is not role-gated in the router
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const isAdmin = user?.role === 'admin'

  // Assessment selector for filtering violations
  const { data: assessmentsData } = useQuery({
    queryKey: ['proctoring-assessments'],
    queryFn: () => api.get('/assessments?limit=100').then((r) => r.data),
    enabled: isAdmin,
  })
  const assessments = assessmentsData?.data || []
  const assessmentsKey = assessments.map((a) => a._id).join(',')

  // Auto-select first assessment when list loads
  useEffect(() => {
    if (!selectedAssessmentId && assessmentsKey) {
      const first = assessmentsKey.split(',')[0]
      if (first) setSelectedAssessmentId(first)
    }
  }, [assessmentsKey, selectedAssessmentId])

  const { data: violationsData, isLoading, error } = useQuery({
    queryKey: ['violations-admin', selectedAssessmentId],
    queryFn: () => api.get(`/proctoring/violations/assessment/${selectedAssessmentId}`).then((r) => r.data),
    enabled: isAdmin && Boolean(selectedAssessmentId),
  })

  const violations = useMemo(() => violationsData?.data || [], [violationsData])

  const { severityCounts, breakdown, maxCount, candidates, recent24h, total } = useMemo(() => {
    const c = {}
    const sev = { low: 0, medium: 0, high: 0 }
    const users = new Set()
    const now = Date.now()
    let recent = 0
    violations.forEach((v) => {
      c[v.type] = (c[v.type] || 0) + 1
      if (sev[v.severity] !== undefined) sev[v.severity] += 1
      if (v.user?._id) users.add(v.user._id)
      if (v.timestamp && now - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000) recent += 1
    })
    const b = Object.entries(c).sort((a, b2) => b2[1] - a[1])
    return {
      severityCounts: sev,
      breakdown: b,
      maxCount: b[0]?.[1] || 1,
      candidates: users.size,
      recent24h: recent,
      total: violations.length,
    }
  }, [violations])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return violations.filter((v) => {
      if (severityFilter && v.severity !== severityFilter) return false
      if (!q) return true
      const label = violationLabels[v.type] || v.type || ''
      return label.toLowerCase().includes(q)
        || (v.type || '').toLowerCase().includes(q)
        || v.user?.name?.toLowerCase().includes(q)
        || v.user?.email?.toLowerCase().includes(q)
        || (v.details || '').toLowerCase().includes(q)
    })
  }, [violations, search, severityFilter])

  const severityChips = [
    { id: '', label: 'All', count: total, color: 'text-text-primary bg-bg-tertiary' },
    { id: 'high', label: 'High', count: severityCounts.high, color: 'text-red-400 bg-red-500/10' },
    { id: 'medium', label: 'Medium', count: severityCounts.medium, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'low', label: 'Low', count: severityCounts.low, color: 'text-blue-400 bg-blue-500/10' },
  ]

  if (!isAdmin) {
    return (
      <div className="py-16 text-center">
        <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
        <p className="text-sm text-text-secondary">Admin access required</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Proctoring Dashboard</h2>
          <p className="mt-1 text-sm text-text-secondary">Monitor candidate violations and proctoring activity</p>
        </div>
      </div>

      {/* Toolbar: assessment selector + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Assessment</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="min-w-[260px] rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select an assessment…</option>
            {assessments.map((a) => (
              <option key={a._id} value={a._id}>{a.title}</option>
            ))}
          </select>
        </div>
        <div className="relative sm:max-w-xs sm:w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search type, candidate, details..." />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Total Violations" value={total} color="bg-primary/10 text-primary" />
        <StatCard icon={ShieldAlert} label="High Severity" value={severityCounts.high} color="bg-danger/10 text-danger" />
        <StatCard icon={Users} label="Candidates Flagged" value={candidates} color="bg-warning/10 text-warning" />
        <StatCard icon={Clock} label="Last 24 Hours" value={recent24h} color="bg-info/10 text-info" />
      </div>

      {/* Severity filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {severityChips.map((chip) => (
          <button
            key={chip.id || 'all'}
            onClick={() => setSeverityFilter(chip.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              severityFilter === chip.id
                ? `${chip.color} ring-1 ring-current`
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {chip.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              severityFilter === chip.id ? 'bg-black/10' : 'bg-bg-secondary text-text-tertiary'
            }`}>
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      {/* Type breakdown — only types that actually occurred */}
      <div className="rounded-xl border border-border bg-bg-secondary p-5">
        <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" /> Violation Breakdown
        </h3>
        {breakdown.length === 0 ? (
          <p className="text-sm text-text-tertiary py-2">No violations recorded for this assessment yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {breakdown.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-text-secondary" title={violationLabels[type] || type}>
                  {violationLabels[type] || type}
                </span>
                <div className="h-2 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-500"
                    style={{ width: `${Math.max((count / maxCount) * 100, 6)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violations feed */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" /> Violations
            <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary">{filtered.length}</span>
          </h3>
        </div>

        {isLoading ? <TableSkeleton rows={8} /> : error ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-danger mx-auto mb-3" />
            <p className="text-sm text-text-secondary">{error?.response?.data?.message || 'Failed to load violations'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card divide-y divide-border overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-sm text-text-secondary">
                  {selectedAssessmentId ? 'No violations match the current filters' : 'Select an assessment to view violations'}
                </p>
              </div>
            ) : filtered.map((v) => {
              const s = severityColors[v.severity] || fallbackSeverity
              return (
                <div key={v._id} className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-tertiary/40">
                  <span className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />

                  <div className={`hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.icon}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-text-primary">{violationLabels[v.type] || v.type}</p>
                      <SeverityChip severity={v.severity} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {v.details || 'No additional details'}
                      {v.attempt ? ` · Attempt #${v.attempt.attemptNumber || '?'}` : ''}
                    </p>
                  </div>

                  <div className="hidden sm:flex shrink-0 items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {initials(v.user?.name)}
                    </div>
                    <div className="leading-tight">
                      <p className="max-w-[140px] truncate text-xs font-medium text-text-primary">{v.user?.name || 'Unknown'}</p>
                      <p className="max-w-[140px] truncate text-[10px] text-text-tertiary">{v.user?.email || ''}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right leading-tight">
                    <p className="text-xs text-text-secondary" title={v.timestamp ? new Date(v.timestamp).toLocaleString() : ''}>
                      {v.timestamp ? formatRelative(v.timestamp) : '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-tertiary sm:hidden">{v.user?.name || 'Unknown'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
