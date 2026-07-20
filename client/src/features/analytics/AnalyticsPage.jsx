import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Loader2, BarChart3, TrendingUp, Clock, CheckCircle, Target, BookOpen, Download } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'
import { exportAnalyticsPDF } from '@/lib/reportUtils'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
          {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function ScoreChart({ scores }) {
  const hasData = scores && scores.length > 0
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Score Trends
      </h3>
      {hasData ? (
        <ScoreBars scores={scores} />
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
          <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No assessment data yet</p>
          <p className="text-xs mt-1">Complete an assessment to see your score trend</p>
        </div>
      )}
    </div>
  )
}

function ScoreBars({ scores }) {
  const maxScore = Math.max(...scores.map((s) => s.score), 100)
  return (
    <div className="flex items-end gap-1.5 h-40">
      {scores.map((s, i) => {
        const height = maxScore > 0 ? (s.score / maxScore) * 100 : 0
        const barColor = s.passed ? '#22C55E' : '#EF4444'
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-bg-tertiary text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
              {s.score}% - {s.assessment}
            </div>
            <div
              className="w-full rounded-t cursor-pointer transition-all duration-300 hover:opacity-80"
              style={{ height: `${height}%`, backgroundColor: barColor }}
            />
          </div>
        )
      })}
    </div>
  )
}

function TypeDistribution({ distribution }) {
  const hasData = distribution && typeof distribution === 'object' && !Array.isArray(distribution) && Object.keys(distribution).length > 0
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" /> Assessment Types
      </h3>
      {hasData ? (
        <TypeBars distribution={distribution} />
      ) : (
        <p className="text-sm text-text-secondary">No data yet</p>
      )}
    </div>
  )
}

function TypeBars({ distribution }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  const colors = ['#4F46E5', '#A78BFA', '#06B6D4', '#22C55E', '#F59E0B']
  return (
    <div className="space-y-3">
      {Object.entries(distribution).map(([type, count], i) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={type}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-primary capitalize">{type}</span>
              <span className="text-text-secondary">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: () => api.get('/analytics/me').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const d = data?.data || {}
  if (Object.keys(d).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-text-secondary">
        <p>No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">My Analytics</h2>
          <p className="text-sm text-text-secondary mt-1">Track your performance and progress</p>
        </div>
        <button
          onClick={() => exportAnalyticsPDF('user', d)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="Total Attempts" value={d.totalAttempts ?? 0} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle} label="Completed" value={d.completed ?? 0} sub={d.passed > 0 ? `${d.passed} passed` : undefined} color="bg-success/10 text-success" />
        <StatCard icon={Target} label="Pass Rate" value={`${d.passRate ?? 0}%`} color="bg-accent/10 text-accent" />
        <StatCard icon={BookOpen} label="Avg Score" value={`${d.avgScore ?? 0}%`} color="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScoreChart scores={d.scores} />
        </div>
        <div className="space-y-6">
          <TypeDistribution distribution={d.typeDistribution} />
          <AIInsightsPanel scope="user" title="Your AI Insights" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary p-5">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Recent Activity
        </h3>
        {d.recentActivity?.length > 0 ? (
          <div className="divide-y divide-border">
            {d.recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`rounded-full p-1.5 ${a.passed ? 'bg-success/10 text-success' : 'text-text-secondary bg-bg-tertiary'}`}>
                    {a.passed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{a.title}</p>
                    <p className="text-xs text-text-secondary">{a.type} &middot; {new Date(a.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${a.passed ? 'text-success' : 'text-text-secondary'}`}>{a.score}%</p>
                  <button
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="text-xs text-primary hover:underline"
                  >
                    View results
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No activity yet</p>
        )}
      </div>
    </div>
  )
}
