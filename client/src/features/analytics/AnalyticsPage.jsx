import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { useAppSelector } from '@/hooks'
import { BarChart3, TrendingUp, Clock, CheckCircle, Target, BookOpen, Download, AlertTriangle, ArrowUpRight, ArrowDownRight, Brain, FileEdit, Users, PieChart, ListChecks, Layers, ClipboardList } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'
import StatCard from './StatCard'
import DonutChart from './DonutChart'
import { SkeletonCard, SkeletonChart } from './Skeletons'
import { exportAnalyticsPDF } from '@/lib/reportUtils'

const ScoreChart = React.memo(function ScoreChart({ scores }) {
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
})

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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-0" preserveAspectRatio="xMidYMid meet">
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

const rangeColors = {
  '0-20': 'bg-red-500',
  '20-40': 'bg-orange-500',
  '40-60': 'bg-amber-500',
  '60-80': 'bg-teal-500',
  '80-100': 'bg-green-500',
}

const difficultyStyles = {
  easy: 'bg-success/10 text-success',
  medium: 'bg-amber-500/10 text-amber-400',
  hard: 'bg-danger/10 text-danger',
}

const mixColors = ['#4F46E5', '#A78BFA', '#06B6D4', '#22C55E', '#F59E0B', '#EC4899']

const scoreTone = (score) => (score >= 60 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger')
const scorePill = (score) => (score >= 60 ? 'bg-success/10 text-success' : score >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-danger/10 text-danger')

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

function PanelHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3">
      <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {count !== undefined && (
        <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-secondary">{count}</span>
      )}
    </div>
  )
}

function QuestionStatusCard({ questions }) {
  const total = questions?.total || 0
  const approvalRate = total > 0 ? Math.round(((questions.approved || 0) / total) * 100) : 0
  const items = [
    { label: 'Approved', value: questions?.approved ?? 0, color: 'bg-success' },
    { label: 'Pending Review', value: questions?.pending ?? 0, color: 'bg-amber-500' },
    { label: 'Draft', value: questions?.draft ?? 0, color: 'bg-zinc-500' },
    { label: 'Rejected', value: questions?.rejected ?? 0, color: 'bg-danger' },
  ]

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> Question Status
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${approvalRate >= 60 ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-400'}`}>
          {approvalRate}% approved
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-text-secondary">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className="font-medium text-text-primary">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreDistributionCard({ distribution, totalAttempts }) {
  const max = Math.max(...Object.values(distribution || {}), 1)
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="text-sm font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" /> Score Distribution
      </h3>
      {distribution && totalAttempts > 0 ? (
        <div className="space-y-3">
          {Object.entries(distribution).map(([range, count]) => (
            <div key={range} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-text-secondary">{range}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-bg-tertiary">
                <div
                  className={`h-full rounded transition-all duration-500 ${rangeColors[range] || 'bg-primary'}`}
                  style={{ width: `${Math.max((count / max) * 100, count > 0 ? 6 : 0)}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-xs font-medium text-text-primary">{count}</span>
              <span className="w-10 shrink-0 text-right text-[10px] text-text-tertiary">
                {totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-text-secondary">No attempt data yet</p>
      )}
    </div>
  )
}

function QuestionMixCard({ types, difficulty }) {
  const hasTypes = types && Object.keys(types).length > 0
  const chartData = hasTypes
    ? Object.entries(types).map(([type, count], i) => ({
        label: type.replace(/_/g, ' '),
        value: count,
        color: mixColors[i % mixColors.length],
      }))
    : []
  const hasDifficulty = difficulty && Object.keys(difficulty).length > 0

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h3 className="text-sm font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
        <PieChart className="h-4 w-4 text-primary" /> Question Mix
      </h3>
      {hasTypes ? (
        <div className="flex justify-center">
          <DonutChart data={chartData} size={140} thickness={20} />
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-text-secondary">No questions yet</p>
      )}
      {hasDifficulty && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            <Layers className="h-3 w-3" /> Difficulty
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(difficulty).map(([level, count]) => (
              <span
                key={level}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${difficultyStyles[level] || 'bg-bg-tertiary text-text-secondary'}`}
              >
                {level} · {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SetterAnalyticsView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['setter-analytics'],
    queryFn: () => api.get('/setter/analytics').then((r) => r.data),
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
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">Content Analytics</h2>
              <p className="text-sm text-text-secondary mt-1">Performance of your questions and assessments</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportAnalyticsPDF('setter', d)} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Brain} label="Questions Created" value={d.questions?.total ?? 0} sub={`${d.questions?.approved ?? 0} approved`} color="bg-primary/10 text-primary" />
        <StatCard icon={FileEdit} label="Assessments" value={d.assessments?.total ?? 0} sub={`${d.assessments?.published ?? 0} published`} color="bg-accent/10 text-accent" />
        <StatCard icon={Users} label="Total Attempts" value={d.totalAttempts ?? 0} sub={`${d.passedCount ?? 0} passed`} color="bg-warning/10 text-warning" />
        <StatCard icon={Target} label="Avg Score" value={`${d.avgScore ?? 0}%`} sub={`Pass rate: ${d.passRate ?? 0}%`} color="bg-success/10 text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuestionStatusCard questions={d.questions} />
        <ScoreDistributionCard distribution={d.scoreDistribution} totalAttempts={d.totalAttempts} />
        <QuestionMixCard types={d.questionTypes} difficulty={d.questionDifficulty} />
      </div>

      {d.assessmentPerformance?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <PanelHeader icon={FileEdit} title="Assessment Performance" count={d.assessmentPerformance.length} />
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
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-tertiary/30 transition-colors">
                    <td className="px-5 py-3 text-text-primary font-medium max-w-[240px] truncate" title={a.title}>{a.title}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[a.status] || 'bg-bg-tertiary text-text-secondary'}`}>
                        {a.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-text-secondary">{a.attempts}</span>
                      {a.attempts > 0 && <span className="block text-[10px] text-text-tertiary">{a.passed} passed</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${scorePill(a.passRate)}`}>
                        {a.passRate}%
                      </span>
                    </td>
                    <td className={`px-5 py-3 font-semibold text-right ${scoreTone(a.avgScore)}`}>{a.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {d.questionPerformance?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <PanelHeader icon={ListChecks} title="Question Performance" count={d.questionPerformance.length} />
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
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-tertiary/30 transition-colors">
                    <td className="px-5 py-3 text-text-primary font-medium max-w-[200px] truncate" title={q.title}>{q.title}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium capitalize text-text-secondary">
                        {q.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${difficultyStyles[q.difficulty] || 'bg-bg-tertiary text-text-secondary'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-right">{q.total}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${scorePill(q.correct)}`}>
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
          <PanelHeader icon={Clock} title="Recent Submissions" count={d.recentAttempts.length} />
          <div className="divide-y divide-border">
            {d.recentAttempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${a.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {initials(a.user)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{a.user}</p>
                    <p className="truncate text-xs text-text-secondary">{a.assessment}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`text-sm font-semibold ${scoreTone(a.score)}`}>{a.score}%</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${a.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {a.passed ? 'Passed' : 'Failed'}
                  </span>
                  <span
                    className="hidden w-20 text-right text-xs text-text-tertiary sm:block"
                    title={a.date ? new Date(a.date).toLocaleString() : ''}
                  >
                    {a.date ? formatRelative(a.date) : '—'}
                  </span>
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
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
