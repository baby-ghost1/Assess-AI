import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAppSelector } from '@/hooks'
import { Button } from '@/components/ui'
import { Brain, Code2, BarChart3, CheckCircle, Loader2, Clock, Trophy, Zap } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-shadow duration-200">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </div>
  )
}

export default function CandidateDashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-dashboard'],
    queryFn: () => api.get('/dashboard/candidate').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const d = data?.data

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}</h2>
          <p className="mt-1 text-sm text-text-secondary">Here's your assessment journey so far</p>
        </div>
        <Button onClick={() => navigate('/ai-quiz')} className="hidden sm:flex">
          <Zap className="h-4 w-4" /> Start AI Quiz
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Brain} label="Assessments Completed" value={d?.completed || 0} color="text-primary bg-primary/10" />
        <StatCard icon={BarChart3} label="Average Score" value={d?.avgScore ? `${d.avgScore}%` : '--'} color="text-accent bg-accent/10" />
        <StatCard icon={CheckCircle} label="Pass Rate" value={d?.passRate ? `${d.passRate}%` : '--'} color="text-success bg-success/10" />
        <StatCard icon={Code2} label="Total Attempts" value={d?.totalAttempts || 0} color="text-warning bg-warning/10" />
      </div>

      {d?.pendingAssessments?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" /> In Progress
            </h3>
          </div>
          <div className="divide-y divide-border">
            {d.pendingAssessments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <p className="text-sm font-medium text-text-primary">{a.title}</p>
                <span className="text-xs text-text-secondary">{new Date(a.startedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-border">
          {d?.recentActivity?.length > 0 ? d.recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{a.title}</p>
                <p className="text-xs text-text-secondary">{new Date(a.date).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.passed ? 'bg-success/10 text-success' : a.status === 'completed' ? 'bg-danger/10 text-danger' : 'bg-bg-tertiary text-text-secondary'}`}>
                {a.status === 'completed' ? (a.passed ? 'Passed' : 'Failed') : a.status}
              </span>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-text-secondary">No activity yet. Start an assessment to see your progress!</div>
          )}
        </div>
      </div>
    </div>
  )
}
