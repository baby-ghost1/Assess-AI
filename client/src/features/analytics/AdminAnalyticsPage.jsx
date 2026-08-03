import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Users, FileText, Target, BarChart3, CheckCircle, Brain, BookOpen, Download, AlertTriangle, TrendingUp } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'
import StatCard from './StatCard'
import DonutChart from './DonutChart'
import { SkeletonCard, SkeletonChart, SkeletonTable } from './Skeletons'

function ScoreDistributionChart({ performance }) {
  const ranges = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%']
  const counts = [0, 0, 0, 0, 0]
  if (performance) {
    performance.forEach((p) => {
      const s = p.score ?? 0
      if (s < 20) counts[0]++
      else if (s < 40) counts[1]++
      else if (s < 60) counts[2]++
      else if (s < 80) counts[3]++
      else counts[4]++
    })
  }
  const maxCount = Math.max(...counts, 1)
  return (
    <div className="space-y-3 mt-4">
      {ranges.map((range, i) => (
        <div key={range} className="flex items-center gap-3">
          <span className="text-xs text-text-secondary w-14 text-right shrink-0">{range}</span>
          <div className="flex-1 h-6 bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts[i] / maxCount) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #1db954, #1ed760)' }}
            />
          </div>
          <span className="text-xs text-text-secondary w-8 shrink-0">{counts[i]}</span>
        </div>
      ))}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
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

  const typeColors = ['#4F46E5', '#A78BFA', '#06B6D4', '#22C55E', '#F59E0B']
  const donutData = (d.assessmentTypeDistribution || []).map((a, i) => ({
    label: a.type,
    value: a.count,
    color: typeColors[i % typeColors.length],
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      {/* Gradient Header */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Admin Analytics</h2>
            <p className="text-sm text-text-secondary mt-1">Platform-wide performance overview</p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href="/api/v1/admin/analytics/report" download>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-border bg-bg-card p-5"
        >
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Score Distribution
          </h3>
          <ScoreDistributionChart performance={d.assessmentPerformance} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl border border-border bg-bg-card p-5"
        >
          <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Recent Attempts Trend
          </h3>
          <AttemptsTrendChart attempts={d.recentAttempts} />
        </motion.div>
      </div>

      <AIInsightsPanel scope="admin" title="Platform AI Insights" />

      {/* Donut chart for type distribution */}
      {donutData.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Assessment Type Distribution
          </h3>
          <DonutChart data={donutData} />
        </div>
      )}

      {/* Recent Attempts - clickable rows */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Recent Attempts
          </h3>
        </div>
        {d.recentAttempts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 pb-3 font-medium text-text-secondary">User</th>
                  <th className="px-5 pb-3 font-medium text-text-secondary">Assessment</th>
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
                    <td className="px-5 py-3 text-text-primary">{a.assessment}</td>
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
