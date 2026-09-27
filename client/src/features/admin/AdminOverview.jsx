import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Users, FileText, Brain, BarChart3, CheckCircle, Activity, Server, HardDrive,
  Clock, TrendingUp, Globe, Cpu,
} from 'lucide-react'

const NEUTRAL = 'bg-bg-tertiary text-text-secondary'

function StatCard({ icon: Icon, label, value, sub, color = NEUTRAL }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 transition-shadow duration-200 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
          <p className="text-2xl font-heading font-bold leading-tight text-text-primary">{value ?? '--'}</p>
          {sub && <p className="truncate text-xs text-text-secondary">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-bg-tertiary" />
        <div className="space-y-2">
          <div className="h-3 bg-bg-tertiary rounded w-20" />
          <div className="h-6 bg-bg-tertiary rounded w-12" />
        </div>
      </div>
    </div>
  )
}

function PanelHeader({ icon: Icon, title, sub, right }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-bg-tertiary p-2 text-text-secondary"><Icon className="h-4 w-4" /></div>
        <div>
          <h3 className="text-sm font-heading font-semibold text-text-primary">{title}</h3>
          {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
        </div>
      </div>
      {right}
    </header>
  )
}

function TypeBarChart({ data }) {
  if (!data?.length) return null
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <PanelHeader
        icon={BarChart3}
        title="Assessment Types"
        sub="Volume by assessment type"
        right={<span className="shrink-0 text-xs text-text-tertiary">{total} total</span>}
      />
      <div className="flex h-32 items-end gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] font-medium text-text-secondary">{d.value}</span>
            <div
              className="w-full rounded-t-md bg-primary-light/60 transition-colors hover:bg-primary-light"
              style={{ height: `${Math.max((d.value / maxVal) * 100, 4)}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="w-full truncate text-center text-[10px] text-text-tertiary">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreTrendChart({ data }) {
  if (!data?.length) return null
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)

  const w = 300
  const h = 110
  const padX = 8
  const padY = 14
  const step = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0
  const toX = (i) => padX + i * step
  const toY = (v) => padY + (h - padY * 2) - (v / maxVal) * (h - padY * 2)
  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const areaPoints = `${toX(0)},${h - padY} ${points} ${toX(data.length - 1)},${h - padY}`

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <PanelHeader
        icon={TrendingUp}
        title="Recent Attempts"
        sub="Score of the latest attempts"
        right={
          <span className="shrink-0 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
            Avg {avg}%
          </span>
        }
      />
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="overviewAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#overviewAreaGrad)" />
        <polyline
          points={points}
          fill="none"
          stroke="#6366F1"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.value)} r="2" fill="#6366F1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-text-tertiary">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function HealthTile({ icon: Icon, label, children }) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-text-tertiary">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold text-text-primary">{children}</div>
    </div>
  )
}

function fmtUptime(sec = 0) {
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default function AdminOverview() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
    enabled: true,
  })

  const { data: healthData } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.get('/admin/health').then((r) => r.data),
  })

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-5 animate-pulse">
              <div className="h-5 bg-bg-tertiary rounded w-40 mb-4" />
              <div className="h-28 bg-bg-tertiary rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5 animate-pulse">
          <div className="h-5 bg-bg-tertiary rounded w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-bg-tertiary rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const s = statsData?.data
  const a = analyticsData?.data
  const h = healthData?.data

  const totalUsers = s?.totalUsers || 0
  const activePct = totalUsers > 0 ? Math.round(((s?.activeUsers || 0) / totalUsers) * 100) : 0
  const completionPct = s?.totalAttempts > 0 ? Math.round((s.completedAttempts / s.totalAttempts) * 100) : 0

  const typeDist = a?.assessmentTypeDistribution || []
  const typeChartData = typeDist.map((d) => ({
    label: d.type || '?',
    value: d.count || 0,
  }))

  const recentAttempts = a?.recentAttempts || []
  const attemptTrend = recentAttempts.slice(-7).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
    value: d.score || 0,
  }))

  const dbConnected = h?.database === 'connected'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={s?.totalUsers} sub="registered accounts" />
        <StatCard icon={Users} label="Active Users" value={s?.activeUsers} sub={`${activePct}% of all users`} />
        <StatCard icon={FileText} label="Assessments" value={s?.totalAssessments} sub="created on platform" />
        <StatCard icon={Brain} label="Questions" value={s?.totalQuestions} sub="in question bank" />
        <StatCard icon={BarChart3} label="Total Attempts" value={s?.totalAttempts} sub={`${completionPct}% completed`} />
        <StatCard icon={CheckCircle} label="Completed" value={s?.completedAttempts} sub="finished attempts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {typeChartData.length > 0 && <TypeBarChart data={typeChartData} />}
        {attemptTrend.length > 1 && <ScoreTrendChart data={attemptTrend} />}
      </div>

      {h && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <PanelHeader
            icon={Server}
            title="System Health"
            sub="Live server status"
            right={
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                dbConnected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-success' : 'bg-danger'}`} />
                {dbConnected ? 'All good' : 'Degraded'}
              </span>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <HealthTile icon={Activity} label="Database">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-success' : 'bg-danger'}`} />
                <span className={dbConnected ? 'text-success' : 'text-danger'}>{h.database}</span>
              </span>
            </HealthTile>
            <HealthTile icon={Clock} label="Uptime">{fmtUptime(h.uptime)}</HealthTile>
            <HealthTile icon={HardDrive} label="Memory">
              {Math.round((h.memory?.rss || 0) / 1024 / 1024)} MB
            </HealthTile>
            <HealthTile icon={Cpu} label="Node.js">{h.nodeVersion}</HealthTile>
            <HealthTile icon={Globe} label="Platform">{h.platform || '—'}</HealthTile>
          </div>
        </div>
      )}
    </div>
  )
}
