import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Loader2, Users, FileText, Target, BarChart3, CheckCircle, Brain, BookOpen, Download } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/analytics/admin').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const d = data?.data
  if (!d) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Admin Analytics</h2>
          <p className="text-sm text-text-secondary mt-1">Platform-wide performance overview</p>
        </div>
        <a
          href="/api/v1/analytics/report/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
          download
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={d.totalUsers} color="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="Assessments" value={d.totalAssessments} color="bg-accent/10 text-accent" />
        <StatCard icon={Brain} label="Questions" value={d.totalQuestions} color="bg-warning/10 text-warning" />
        <StatCard icon={BarChart3} label="Total Attempts" value={d.totalAttempts} color="bg-info/10 text-info" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={CheckCircle} label="Completed" value={d.completedAttempts} color="bg-success/10 text-success" />
        <StatCard icon={Target} label="Pass Rate" value={`${d.passRate}%`} color="bg-primary/10 text-primary" />
      </div>

      <AIInsightsPanel scope="admin" title="Platform AI Insights" />

      <div className="rounded-xl border border-border bg-bg-secondary p-5">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Assessment Type Distribution
        </h3>
        {d.assessmentTypeDistribution?.length > 0 ? (
          <div className="space-y-3">
            {d.assessmentTypeDistribution.map((a) => {
              const total = d.assessmentTypeDistribution.reduce((acc, x) => acc + x.count, 0)
              const pct = total > 0 ? (a.count / total) * 100 : 0
              return (
                <div key={a.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-primary capitalize">{a.type}</span>
                    <span className="text-text-secondary">{a.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No assessments yet</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary p-5">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Recent Attempts
        </h3>
        {d.recentAttempts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-text-secondary">User</th>
                  <th className="pb-3 font-medium text-text-secondary">Assessment</th>
                  <th className="pb-3 font-medium text-text-secondary">Score</th>
                  <th className="pb-3 font-medium text-text-secondary">Status</th>
                  <th className="pb-3 font-medium text-text-secondary">Date</th>
                  <th className="pb-3 font-medium text-text-secondary" />
                </tr>
              </thead>
              <tbody>
                {d.recentAttempts.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-3 text-text-primary">{a.user}</td>
                    <td className="py-3 text-text-primary">{a.assessment}</td>
                    <td className={`py-3 font-semibold ${a.passed ? 'text-success' : 'text-danger'}`}>{a.score}%</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === 'completed' ? 'bg-success/10 text-success' :
                        a.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-text-secondary">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/results/${a.id}`)}
                        className="text-primary hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No attempts yet</p>
        )}
      </div>
    </div>
  )
}
