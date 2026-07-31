import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, BarChart3, Target, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'
import StatCard from './StatCard'
import { SkeletonCard, SkeletonChart } from './Skeletons'
import { exportAnalyticsPDF } from '@/lib/reportUtils'

function ScoreBarChart({ data }) {
  if (!data || data.length === 0) return null
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary">{d.count}</span>
          <div className="w-full rounded-t transition-all duration-500" style={{ height: `${(d.count / maxCount) * 100}%`, background: 'linear-gradient(to top, #4F46E5, #818CF8)' }} />
          <span className="text-xs text-text-secondary text-center">{d.range}</span>
        </div>
      ))}
    </div>
  )
}

function QuestionStatCard({ qs }) {
  const pct = qs.correctPercentage
  const barColor = pct >= 70 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="rounded-lg bg-bg-tertiary p-3 text-sm">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-text-primary font-medium truncate">{qs.title}</p>
          <p className="text-text-secondary text-xs mt-0.5 capitalize">{qs.type} · {qs.difficulty}</p>
        </div>
        <span className={`text-xs font-semibold ml-2 ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-secondary mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex gap-3 mt-2 text-xs text-text-secondary">
        <span className="text-success">+{qs.correct}</span>
        <span className="text-danger">-{qs.incorrect}</span>
        <span>Skipped: {qs.skipped}</span>
        <span>Avg: {(qs.avgTime / 1000).toFixed(1)}s</span>
      </div>
    </div>
  )
}

export default function AssessmentAnalyticsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment-analytics', id],
    queryFn: () => api.get(`/analytics/assessment/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse">
          <div className="h-7 bg-bg-tertiary rounded w-48 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-danger mx-auto mb-3" />
          <p className="text-text-primary font-medium">Failed to load analytics</p>
          <p className="text-sm text-text-secondary mt-1">{error?.message || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  const d = data?.data
  if (!d) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
          <BarChart3 className="h-8 w-8 text-text-secondary mx-auto mb-3 opacity-40" />
          <p className="text-text-primary font-medium">No analytics data available</p>
          <p className="text-sm text-text-secondary mt-1">Data will appear once candidates start attempting this assessment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Gradient Header */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">{d.title}</h2>
              <p className="text-sm text-text-secondary mt-1">Assessment Analytics</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportAnalyticsPDF('assessment', d, { title: d.title })} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Attempts" value={d.totalAttempts} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle} label="Passed" value={d.passed} color="bg-success/10 text-success" />
        <StatCard icon={Target} label="Pass Rate" value={`${d.passRate}%`} color="bg-accent/10 text-accent" />
        <StatCard icon={Clock} label="Avg Score" value={`${d.avgScore}%`} color="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Score Distribution
          </h3>
          <ScoreBarChart data={d.scoreDistribution} />
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Question Stats
          </h3>
          {d.questionStats?.length > 0 ? (
            <div className="space-y-3 mt-4 max-h-80 overflow-y-auto">
              {d.questionStats.map((qs) => (
                <QuestionStatCard key={qs.questionId} qs={qs} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
              <Target className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No submissions yet</p>
            </div>
          )}
        </div>
      </div>

      {d.recentAttempts?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Attempts
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 pb-3 font-medium text-text-secondary">User</th>
                  <th className="px-5 pb-3 font-medium text-text-secondary">Score</th>
                  <th className="px-5 pb-3 font-medium text-text-secondary">Status</th>
                  <th className="px-5 pb-3 font-medium text-text-secondary">Date</th>
                </tr>
              </thead>
              <tbody>
                {d.recentAttempts.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="border-b border-border last:border-0 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-text-primary">{a.user}</td>
                    <td className={`px-5 py-3 font-semibold ${a.passed ? 'text-success' : 'text-danger'}`}>{a.score}%</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === 'completed' ? 'bg-success/10 text-success' :
                        a.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{new Date(a.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
