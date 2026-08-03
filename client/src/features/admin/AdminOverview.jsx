import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Users, FileText, Brain, BarChart3, CheckCircle, Activity, Server, HardDrive, Clock } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
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

export default function AdminOverview() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
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
  const h = healthData?.data

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
