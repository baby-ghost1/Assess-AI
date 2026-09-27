import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import {
  Users, FileText, Brain, BarChart3, CheckCircle, Target, Activity, PieChart,
  BookOpen, Download, AlertTriangle, TrendingUp, ChevronRight,
} from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'
import StatCard from './StatCard'
import DonutChart from './DonutChart'
import { SkeletonCard, SkeletonChart, SkeletonTable } from './Skeletons'
import { notify, apiErrorMessage } from '@/lib/notify'

const NEUTRAL = 'bg-bg-tertiary text-text-secondary'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

function formatRelative(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Panel({ icon: Icon, title, sub, right, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="rounded-xl border border-border bg-bg-card p-5"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-bg-tertiary p-2 text-text-secondary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold text-text-primary">{title}</h3>
            {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
          </div>
        </div>
        {right}
      </header>
      {children}
    </motion.section>
  )
}

function ScoreDistributionPanel({ attempts }) {
  const ranges = ['0–20%', '20–40%', '40–60%', '60–80%', '80–100%']
  const counts = [0, 0, 0, 0, 0]
  attempts.forEach((a) => {
    const s = a.score ?? 0
    if (s < 20) counts[0]++
    else if (s < 40) counts[1]++
    else if (s < 60) counts[2]++
    else if (s < 80) counts[3]++
    else counts[4]++
  })
  const total = attempts.length
  const maxCount = Math.max(...counts, 1)
  const barTones = ['bg-primary-light/40', 'bg-primary-light/55', 'bg-primary-light/70', 'bg-primary-light/85', 'bg-primary-light']

  if (!total) {
    return (
      <div className="py-10 text-center text-sm text-text-secondary">
        <Activity className="mx-auto mb-2 h-8 w-8 opacity-30" />
        No recent attempts to chart
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ranges.map((range, i) => {
        const share = Math.round((counts[i] / total) * 100)
        return (
          <div key={range} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-xs text-text-secondary">{range}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-tertiary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(counts[i] / maxCount) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                className={`h-full rounded-full ${barTones[i]}`}
              />
            </div>
            <span className="w-8 shrink-0 text-xs font-medium text-text-primary">{counts[i]}</span>
            <span className="w-10 shrink-0 text-right text-xs text-text-tertiary">{share}%</span>
          </div>
        )
      })}
    </div>
  )
}

function AttemptsTrendChart({ attempts }) {
  if (!attempts || attempts.length === 0) return null
  const last10 = attempts.slice(-10)
  const w = 460
  const h = 160
  const padX = 40
  const padY = 20
  const chartW = w - padX * 2
  const chartH = h - padY * 2
  const points = last10.map((a, i) => ({
    x: padX + (i / Math.max(last10.length - 1, 1)) * chartW,
    y: padY + chartH - (a.score / 100) * chartH,
    score: a.score,
    label: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 mt-4">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1db954" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1db954" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padY + chartH - (v / 100) * chartH
        return (
          <g key={v}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="currentColor" className="text-border" strokeWidth="0.5" />
            <text x={padX - 6} y={y + 3} textAnchor="end" className="fill-current text-text-secondary" fontSize="9">{v}</text>
          </g>
        )
      })}
      <motion.path
        d={areaD}
        fill="url(#trendGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke="#1db954"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#1db954" stroke="var(--bg-card, #fff)" strokeWidth="2" />
          <text x={p.x} y={padY + chartH + 14} textAnchor="middle" className="fill-current text-text-secondary" fontSize="8">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

export default function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 animate-pulse">
          <div className="h-7 bg-bg-tertiary rounded w-40 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-56" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
        <SkeletonTable />
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
          <p className="text-sm text-text-secondary mt-1">Data will appear once users start taking assessments</p>
        </div>
      </div>
    )
  }

  const recentAttempts = d.recentAttempts || []
  const completionRate = d.totalAttempts > 0 ? Math.round((d.completedAttempts / d.totalAttempts) * 100) : 0
  const typeColors = ['#6366F1', '#06B6D4', '#A1A1AA', '#22C55E', '#F59E0B']
  const donutData = (d.assessmentTypeDistribution || []).map((a, i) => ({
    label: a.type,
    value: a.count,
    color: typeColors[i % typeColors.length],
  }))

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/analytics/report', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-report-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Failed to export report'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary-light">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-text-primary">Platform Analytics</h2>
              <p className="text-sm text-text-secondary mt-0.5">Platform-wide performance overview</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={d.totalUsers} sub="registered accounts" color={NEUTRAL} />
        <StatCard icon={FileText} label="Assessments" value={d.totalAssessments} sub="created on platform" color={NEUTRAL} />
        <StatCard icon={Brain} label="Questions" value={d.totalQuestions} sub="in question bank" color={NEUTRAL} />
        <StatCard icon={BarChart3} label="Total Attempts" value={d.totalAttempts} sub={`${completionRate}% completed`} color={NEUTRAL} />
        <StatCard icon={CheckCircle} label="Completed" value={d.completedAttempts} sub="finished attempts" color={NEUTRAL} />
        <StatCard icon={Target} label="Pass Rate" value={`${d.passRate}%`} sub="of completed attempts" color={NEUTRAL} />
      </div>

      {/* Score + type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          icon={Activity}
          title="Score Distribution"
          sub="Score spread across recent attempts"
          right={<span className="shrink-0 text-xs text-text-tertiary">last {recentAttempts.length}</span>}
          delay={0}
        >
          <ScoreDistributionPanel attempts={recentAttempts} />
        </Panel>

        <Panel
          icon={PieChart}
          title="Assessment Types"
          sub="Share of assessments by type"
          delay={0.08}
        >
          {donutData.length > 0 ? <DonutChart data={donutData} /> : (
            <div className="py-10 text-center text-sm text-text-secondary">
              <PieChart className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No assessments yet
            </div>
          )}
        </Panel>
      </div>

      {/* Recent Attempts Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-border bg-bg-card p-5"
      >
        <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Recent Attempts Trend
        </h3>
        <AttemptsTrendChart attempts={d.recentAttempts} />
      </motion.div>

      <AIInsightsPanel scope="admin" title="Platform AI Insights" />

      {/* Recent Attempts - clickable rows */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-text-secondary" /> Recent Attempts
          </h3>
          <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">{recentAttempts.length}</span>
        </div>
        {recentAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 pb-3 font-medium text-text-tertiary">User</th>
                  <th className="px-5 pb-3 font-medium text-text-tertiary">Assessment</th>
                  <th className="px-5 pb-3 font-medium text-text-tertiary">Score</th>
                  <th className="px-5 pb-3 font-medium text-text-tertiary">Status</th>
                  <th className="px-5 pb-3 text-right font-medium text-text-tertiary">When</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="group border-b border-border last:border-0 hover:bg-bg-tertiary/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-[10px] font-semibold text-text-secondary">
                          {initials(a.user)}
                        </span>
                        <span className="text-text-primary">{a.user}</span>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-text-secondary">{a.assessment}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        a.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {a.score}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === 'completed' ? 'bg-success/10 text-success' :
                        a.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          a.status === 'completed' ? 'bg-success' :
                          a.status === 'in_progress' ? 'bg-warning' : 'bg-text-tertiary'
                        }`} />
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1 text-xs text-text-secondary"
                        title={new Date(a.date).toLocaleString()}
                      >
                        {formatRelative(a.date)}
                        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-text-secondary">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No attempts yet
          </div>
        )}
      </div>
    </div>
  )
}
