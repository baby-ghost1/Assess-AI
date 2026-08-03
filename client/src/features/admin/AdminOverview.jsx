import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Users, FileText, Brain, BarChart3, CheckCircle, Activity, Server, HardDrive, Clock, TrendingUp, TrendingDown } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, trend, trendValue }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                trend > 0 ? 'text-success bg-success/10' : trend < 0 ? 'text-danger bg-danger/10' : 'text-text-tertiary bg-bg-tertiary'
              }`}>
                {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : trend < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : null}
                {trendValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5 animate-pulse">
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

function MiniBarChart({ data, label, height = 80 }) {
  if (!data?.length) return null
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.floor(100 / data.length)

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-primary" /> {label}
      </h3>
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height - 10)
          return (
            <g key={i}>
              <rect
                x={i * barWidth + barWidth * 0.15}
                y={height - barH}
                width={barWidth * 0.7}
                height={barH}
                rx="1"
                fill={d.color || '#4F46E5'}
                opacity="0.85"
              />
              <text
                x={i * barWidth + barWidth / 2}
                y={height - barH - 2}
                textAnchor="middle"
                fontSize="3"
                fill="#9CA3AF"
              >
                {d.value}
              </text>
              <text
                x={i * barWidth + barWidth / 2}
                y={height}
                textAnchor="middle"
                fontSize="2.5"
                fill="#6B7280"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function TrendLineChart({ data, label, height = 80 }) {
  if (!data?.length) return null
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const step = 100 / (data.length - 1 || 1)

  const points = data.map((d, i) => {
    const x = i * step
    const y = height - 5 - ((d.value / maxVal) * (height - 15))
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,${height - 5} ${points} 100,${height - 5}`

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" /> {label}
      </h3>
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline points={points} fill="none" stroke="#4F46E5" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = i * step
          const y = height - 5 - ((d.value / maxVal) * (height - 15))
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="1.5" fill="#4F46E5" />
              <text x={x} y={height} textAnchor="middle" fontSize="2.5" fill="#6B7280">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-secondary p-5 animate-pulse">
              <div className="h-5 bg-bg-tertiary rounded w-40 mb-4" />
              <div className="h-20 bg-bg-tertiary rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-5 animate-pulse">
          <div className="h-5 bg-bg-tertiary rounded w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-bg-tertiary" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-bg-tertiary rounded w-16" />
                  <div className="h-4 bg-bg-tertiary rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const s = statsData?.data
  const a = analyticsData?.data
  const h = healthData?.data

  const typeDist = a?.assessmentTypeDistribution || []
  const typeColors = { quiz: '#4F46E5', coding: '#EC4899', mixed: '#8B5CF6' }
  const typeChartData = typeDist.map((d) => ({
    label: d.type?.slice(0, 6) || '?',
    value: d.count || 0,
    color: typeColors[d.type] || '#6B7280',
  }))

  const recentAttempts = a?.recentAttempts || []
  const attemptTrend = recentAttempts.slice(-7).map((d, i) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
    value: d.score || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={s?.totalUsers || '--'} color="bg-primary/10 text-primary" />
        <StatCard icon={Users} label="Active Users" value={s?.activeUsers || '--'} color="bg-success/10 text-success" />
        <StatCard icon={FileText} label="Assessments" value={s?.totalAssessments || '--'} color="bg-accent/10 text-accent" />
        <StatCard icon={Brain} label="Questions" value={s?.totalQuestions || '--'} color="bg-warning/10 text-warning" />
        <StatCard icon={BarChart3} label="Total Attempts" value={s?.totalAttempts || '--'} color="bg-info/10 text-info" />
        <StatCard icon={CheckCircle} label="Completed" value={s?.completedAttempts || '--'} color="bg-success/10 text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {typeChartData.length > 0 && (
          <MiniBarChart data={typeChartData} label="Assessment Types" />
        )}
        {attemptTrend.length > 1 && (
          <TrendLineChart data={attemptTrend} label="Recent Attempts (Score)" />
        )}
      </div>

      {h && (
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> System Health
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Database</p>
                <p className={`text-sm font-semibold ${h.database === 'connected' ? 'text-success' : 'text-danger'}`}>
                  {h.database}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Uptime</p>
                <p className="text-sm font-semibold text-text-primary">{Math.floor(h.uptime / 3600)}h {Math.floor((h.uptime % 3600) / 60)}m</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Memory (RSS)</p>
                <p className="text-sm font-semibold text-text-primary">{Math.round(h.memory?.rss / 1024 / 1024)} MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-text-secondary" />
              <div>
                <p className="text-xs text-text-secondary">Node.js</p>
                <p className="text-sm font-semibold text-text-primary">{h.nodeVersion}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
