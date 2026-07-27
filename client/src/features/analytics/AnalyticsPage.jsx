import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { useAppSelector } from '@/hooks'
import { Loader2, BarChart3, TrendingUp, Clock, CheckCircle, Target, BookOpen, Download, AlertTriangle, ArrowUpRight, ArrowDownRight, Brain, FileEdit, Users, AlertCircle } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'
import StatCard from './StatCard'
import DonutChart from './DonutChart'
import { SkeletonCard, SkeletonChart } from './Skeletons'
import { exportAnalyticsPDF } from '@/lib/reportUtils'

function ScoreChart({ scores }) {
  const hasData = scores && scores.length > 0

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Score Trends
      </h3>
      {hasData ? <ScoreLineChart scores={scores} /> : (
        <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
          <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No assessment data yet</p>
          <p className="text-xs mt-1">Complete an assessment to see your score trend</p>
        </div>
      )}
    </div>
  )
}

function ScoreLineChart({ scores }) {
  const [hovered, setHovered] = useState(null)
  const sorted = [...scores].sort((a, b) => new Date(a.date) - new Date(b.date))
  const W = 700, H = 240, PAD = { top: 40, right: 20, bottom: 40, left: 40 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const minS = 0, maxS = 100
  const yScale = (v) => PAD.top + plotH - ((v - minS) / (maxS - minS)) * plotH
  const xScale = (i) => sorted.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (sorted.length - 1)) * plotW

  const points = sorted.map((s, i) => ({ x: xScale(i), y: yScale(s.score), ...s }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.top + plotH} L ${points[0].x} ${PAD.top + plotH} Z`

  const yTicks = [0, 25, 50, 75, 100]
  const maxLabels = 8
  const labelStep = Math.max(1, Math.ceil(sorted.length / maxLabels))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} y1={yScale(t)} x2={W - PAD.right} y2={yScale(t)} stroke="#27272A" strokeWidth="1" />
            <text x={PAD.left - 8} y={yScale(t) + 4} textAnchor="end" className="fill-text-tertiary text-[10px]">{t}</text>
          </g>
        ))}

        <path d={areaD} fill="url(#scoreGrad)" />
        <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y} r="12"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <circle
              cx={p.x} cy={p.y}
              r={hovered === i ? 7 : 5}
              fill={p.passed ? '#22C55E' : '#EF4444'}
              stroke="#09090B" strokeWidth="2"
              className="pointer-events-none transition-all duration-150"
            />
            {hovered === i && (
              <g className="pointer-events-none">
                <rect x={p.x - 50} y={p.y - 42} width="100" height="30" rx="6" fill="#18181B" stroke="#27272A" strokeWidth="1" />
                <text x={p.x} y={p.y - 22} textAnchor="middle" className="fill-text-primary text-[11px] font-semibold">
                  {p.score}%
                </text>
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-text-secondary text-[8px]">
                  {p.assessment?.length > 18 ? p.assessment.slice(0, 18) + '…' : p.assessment}
                </text>
              </g>
            )}
            {i % labelStep === 0 && (
              <text x={p.x} y={H - 8} textAnchor="middle" className="fill-text-tertiary text-[9px]">
                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            )}
          </g>
        ))}

        {sorted.length === 1 && (
          <text x={points[0].x} y={H - 8} textAnchor="middle" className="fill-text-tertiary text-[9px]">
            {new Date(sorted[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
        )}
      </svg>
    </div>
  )
}

function TypeDistribution({ distribution }) {
  const hasData = distribution && typeof distribution === 'object' && !Array.isArray(distribution) && Object.keys(distribution).length > 0
  if (!hasData) return null

  const colors = ['#4F46E5', '#A78BFA', '#06B6D4', '#22C55E', '#F59E0B']
  const chartData = Object.entries(distribution).map(([type, count], i) => ({
    label: type,
    value: count,
    color: colors[i % colors.length],
  }))

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" /> Assessment Types
      </h3>
      <DonutChart data={chartData} />
    </div>
  )
}

const statusColors = {
  draft: 'bg-zinc-500/10 text-zinc-400',
  published: 'bg-green-500/10 text-green-400',
  approved: 'bg-green-500/10 text-green-400',
  pending_review: 'bg-amber-500/10 text-amber-400',
  rejected: 'bg-red-500/10 text-red-400',
}

function SetterAnalyticsView() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['setter-analytics'],
    queryFn: () => api.get('/analytics/setter').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse">
          <div className="h-7 bg-bg-tertiary rounded w-40 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-56" />
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

  const d = data?.data || {}

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Content Analytics</h2>
            <p className="text-sm text-text-secondary mt-1">Performance of your questions and assessments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Questions Created" value={d.questions?.total ?? 0} sub={`${d.questions?.approved ?? 0} approved`} color="bg-primary/10 text-primary" />
        <StatCard icon={FileEdit} label="Assessments" value={d.assessments?.total ?? 0} sub={`${d.assessments?.published ?? 0} published`} color="bg-accent/10 text-accent" />
        <StatCard icon={Users} label="Total Attempts" value={d.totalAttempts ?? 0} color="bg-warning/10 text-warning" />
        <StatCard icon={Target} label="Avg Score" value={`${d.avgScore ?? 0}%`} sub={`Pass rate: ${d.passRate ?? 0}%`} color="bg-success/10 text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Question Status</h3>
          <div className="space-y-2">
            {[
              { label: 'Approved', value: d.questions?.approved ?? 0, color: 'bg-success' },
              { label: 'Pending', value: d.questions?.pending ?? 0, color: 'bg-amber-500' },
              { label: 'Draft', value: d.questions?.draft ?? 0, color: 'bg-zinc-500' },
              { label: 'Rejected', value: d.questions?.rejected ?? 0, color: 'bg-danger' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-text-secondary">{item.label}</span>
                </div>
                <span className="font-medium text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Score Distribution</h3>
          {d.scoreDistribution ? (
            <div className="space-y-2">
              {Object.entries(d.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-16 shrink-0">{range}</span>
                  <div className="flex-1 h-5 bg-bg-tertiary rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded transition-all"
                      style={{ width: d.totalAttempts > 0 ? `${(count / d.totalAttempts) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-text-primary font-medium w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">No attempt data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Question Types</h3>
          {d.questionTypes && Object.keys(d.questionTypes).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(d.questionTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">No questions yet</p>
          )}
        </div>
      </div>

      {d.assessmentPerformance?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary">Assessment Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-medium text-text-secondary">Assessment</th>
                  <th className="px-5 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Attempts</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Pass Rate</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {d.assessmentPerformance.map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-tertiary/30">
                    <td className="px-5 py-3 text-text-primary font-medium">{a.title}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[a.status] || 'bg-bg-tertiary text-text-secondary'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-right">{a.attempts}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${a.passRate >= 60 ? 'text-success' : a.passRate >= 40 ? 'text-warning' : 'text-danger'}`}>
                        {a.passRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-primary font-medium text-right">{a.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.questionPerformance?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary">Question Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-medium text-text-secondary">Question</th>
                  <th className="px-5 py-3 font-medium text-text-secondary">Type</th>
                  <th className="px-5 py-3 font-medium text-text-secondary">Difficulty</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Correct %</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Skip %</th>
                  <th className="px-5 py-3 font-medium text-text-secondary text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {d.questionPerformance.map((q, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-tertiary/30">
                    <td className="px-5 py-3 text-text-primary font-medium max-w-[200px] truncate">{q.title}</td>
                    <td className="px-5 py-3 text-text-secondary capitalize">{q.type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-text-secondary capitalize">{q.difficulty}</td>
                    <td className="px-5 py-3 text-text-secondary text-right">{q.total}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${q.correct >= 60 ? 'text-success' : q.correct >= 40 ? 'text-warning' : 'text-danger'}`}>
                        {q.correct}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-right">{q.skipped}%</td>
                    <td className="px-5 py-3 text-text-secondary text-right">{q.avgTime}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.recentAttempts?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Submissions
            </h3>
          </div>
          <div className="divide-y divide-border">
            {d.recentAttempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${a.passed ? 'bg-success' : 'bg-danger'}`} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.user}</p>
                    <p className="text-xs text-text-secondary">{a.assessment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-primary">{a.score}%</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${a.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {a.passed ? 'Passed' : 'Failed'}
                  </span>
                  <span className="text-xs text-text-secondary">{new Date(a.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CandidateAnalyticsView() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: () => api.get('/analytics/me').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse">
          <div className="h-7 bg-bg-tertiary rounded w-40 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-56" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart className="lg:col-span-2" />
          <SkeletonChart />
        </div>
        <SkeletonChart />
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
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">My Analytics</h2>
            <p className="text-sm text-text-secondary mt-1">Track your performance and progress</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportAnalyticsPDF('user', d)} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
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

      <div className="rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-border">
          {d.recentActivity?.length > 0 ? d.recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${a.status === 'completed' ? (a.passed ? 'bg-success' : 'bg-danger') : 'bg-warning'}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-secondary">{new Date(a.date).toLocaleDateString()} · {a.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.status === 'completed' && (
                  <span className="text-sm font-semibold text-text-primary">{a.score}%</span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${a.passed ? 'bg-success/10 text-success' : a.status === 'completed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                  {a.status === 'completed' ? (a.passed ? 'Passed' : 'Failed') : 'In Progress'}
                </span>
                {a.status === 'completed' && (a.passed ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-danger" />
                ))}
              </div>
            </div>
          )) : (
            <div className="px-5 py-10 text-center text-sm text-text-secondary">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No activity yet. Start an assessment to see your progress!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAppSelector((s) => s.auth)

  if (user?.role === 'setter') {
    return <SetterAnalyticsView />
  }

  return <CandidateAnalyticsView />
}
