import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Loader2, ArrowLeft, BarChart3, Target, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'
import { exportAnalyticsPDF } from '@/lib/reportUtils'

function BarChart({ data }) {
  if (!data || data.length === 0) return null
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary">{d.count}</span>
          <div className="w-full bg-primary rounded-t transition-all duration-500" style={{ height: `${(d.count / maxCount) * 100}%` }} />
          <span className="text-xs text-text-secondary text-center">{d.range}</span>
        </div>
      ))}
    </div>
  )
}

export default function AssessmentAnalyticsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['assessment-analytics', id],
    queryFn: () => api.get(`/analytics/assessment/${id}`).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const d = data?.data
  if (!d) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">{d.title}</h2>
            <p className="text-sm text-text-secondary mt-1">Assessment Analytics</p>
          </div>
        </div>
        <button
          onClick={() => exportAnalyticsPDF('assessment', d, { title: d.title })}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-text-secondary">Total Attempts</p>
              <p className="text-2xl font-heading font-bold text-text-primary">{d.totalAttempts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-success/10 text-success"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-text-secondary">Passed</p>
              <p className="text-2xl font-heading font-bold text-text-primary">{d.passed}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-accent/10 text-accent"><Target className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-text-secondary">Pass Rate</p>
              <p className="text-2xl font-heading font-bold text-text-primary">{d.passRate}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5 bg-warning/10 text-warning"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-text-secondary">Avg Score</p>
              <p className="text-2xl font-heading font-bold text-text-primary">{d.avgScore}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Score Distribution
          </h3>
          <BarChart data={d.scoreDistribution} />
        </div>
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Question Stats
          </h3>
          {d.questionStats?.length > 0 ? (
            <div className="space-y-3 mt-4 max-h-80 overflow-y-auto">
              {d.questionStats.map((qs) => (
                <div key={qs.questionId} className="rounded-lg bg-bg-tertiary p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary font-medium truncate">{qs.title}</p>
                      <p className="text-text-secondary text-xs mt-0.5 capitalize">{qs.type} &middot; {qs.difficulty}</p>
                    </div>
                    <span className={`text-xs font-semibold ml-2 ${
                      qs.correctPercentage >= 70 ? 'text-success' :
                      qs.correctPercentage >= 40 ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {qs.correctPercentage}%
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-text-secondary">
                    <span className="text-success">+{qs.correct}</span>
                    <span className="text-danger">-{qs.incorrect}</span>
                    <span>Skipped: {qs.skipped}</span>
                    <span>Avg: {(qs.avgTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary mt-4">No submissions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
