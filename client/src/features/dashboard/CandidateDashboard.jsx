import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAppSelector } from '@/hooks'
import { Button } from '@/components/ui'
import { Brain, Code2, BarChart3, CheckCircle, Loader2, Clock, Trophy, Zap, Flame, Target, Star, ArrowUpRight, ArrowDownRight, TrendingUp, BookOpen, ChevronRight, Sparkles, Award, AlertTriangle, Quote, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import AnimatedNumber from '@/lib/animatedNumber'

function ProgressRing({ progress, size = 60, stroke = 5, color = '#4F46E5' }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272A" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
    </svg>
  )
}

const MOTIVATIONAL_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
]

function MotivationalQuote() {
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 flex items-start gap-3">
      <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
        <Quote className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm text-text-primary italic">"{quote.text}"</p>
        <p className="text-xs text-text-tertiary mt-1">— {quote.author}</p>
      </div>
    </div>
  )
}

function ActivityHeatmap({ recentActivity }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const today = new Date()
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const colors = ['bg-emerald-950/40', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-700']

  const yearOptions = []
  for (let y = today.getFullYear(); y >= today.getFullYear() - 5; y--) yearOptions.push(y)

  const getCount = (dateStr) => {
    return recentActivity?.filter(
      (a) => {
        const d = new Date(a.date)
        return d.getFullYear() === selectedYear &&
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === dateStr &&
          a.status === 'completed'
      }
    ).length || 0
  }

  const getIntensity = (dateStr) => {
    const count = getCount(dateStr)
    return count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3
  }

  const months = monthNames.map((name, mi) => {
    const firstDay = new Date(selectedYear, mi, 1).getDay()
    const daysInMonth = new Date(selectedYear, mi + 1, 0).getDate()
    const cells = []
    for (let e = 0; e < firstDay; e++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, mi, d)
      const isFuture = date > today
      const dateStr = `${selectedYear}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, dateStr, isFuture, intensity: isFuture ? -1 : getIntensity(dateStr) })
    }
    return { name, cells }
  })

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Activity
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="text-xs font-medium bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-primary cursor-pointer"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-3 min-w-fit">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pt-[18px]">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[11px] flex items-center">
                <span className="text-[9px] text-text-tertiary leading-none w-3 text-right">{label}</span>
              </div>
            ))}
          </div>

          {/* Month grids */}
          {months.map((month, mi) => (
            <div key={mi} className="flex flex-col">
              <div className="text-[10px] text-text-secondary font-medium mb-1 text-center h-[14px]">{month.name}</div>
              <div className="grid grid-cols-7 gap-[3px]">
                {month.cells.map((cell, ci) => {
                  if (!cell) return <div key={`e-${ci}`} className="w-[11px] h-[11px]" />
                  return (
                    <div
                      key={`d-${ci}`}
                      className={`w-[11px] h-[11px] rounded-[2px] transition-colors ${cell.intensity === -1 ? 'bg-transparent' : colors[cell.intensity]}`}
                      title={cell.isFuture ? '' : `${cell.dateStr}: ${cell.intensity === 0 ? 'No' : getCount(cell.dateStr)} completed`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[9px] text-text-tertiary">Less</span>
          {colors.map((c, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
          ))}
          <span className="text-[9px] text-text-tertiary">More</span>
        </div>
      </div>
    </div>
  )
}

export default function CandidateDashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-dashboard'],
    queryFn: () => api.get('/dashboard/candidate').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="rounded-xl border border-border bg-bg-card p-6 text-center max-w-sm">
          <AlertTriangle className="h-8 w-8 text-danger mx-auto mb-3" />
          <p className="text-text-primary font-medium">Failed to load dashboard</p>
          <p className="text-sm text-text-secondary mt-1">{error?.message || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  const d = data?.data

  return (
    <div className="space-y-6">

      {/* ── GREETING SECTION ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
              {d?.greeting?.emoji} {d?.greeting?.text}, {user?.name?.split(' ')[0] || 'Candidate'}!
            </h2>
            <p className="text-sm text-text-secondary">Here's your learning journey at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            {d?.pendingAssessments?.length > 0 && (
              <Button onClick={() => navigate('/assessments')} variant="outline" size="sm">
                <Clock className="h-4 w-4" /> Continue ({d.pendingAssessments.length})
              </Button>
            )}
            <Button onClick={() => navigate('/ai-quiz')} size="sm">
              <Zap className="h-4 w-4" /> Start AI Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* ── MOTIVATIONAL QUOTE ───────────────────────── */}
      <MotivationalQuote />

      {/* ── STATS + LEVEL ROW ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Brain, label: 'Completed', value: d?.completed || 0, color: 'text-primary bg-primary/10' },
            { icon: BarChart3, label: 'Avg Score', value: d?.avgScore ? `${d.avgScore}` : '0', suffix: '%', color: 'text-accent bg-accent/10' },
            { icon: CheckCircle, label: 'Pass Rate', value: d?.passRate ? `${d.passRate}` : '0', suffix: '%', color: 'text-success bg-success/10' },
            { icon: Flame, label: 'Streak', value: d?.streak || 0, suffix: 'd', color: 'text-orange-500 bg-orange-500/10' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-bg-card p-4 hover:shadow-lg transition-shadow duration-200">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-4.5 w-4.5" /></div>
              <p className="text-2xl font-bold text-text-primary">
                <AnimatedNumber value={s.value} />{s.suffix || ''}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Level / XP Card */}
        <div className="rounded-xl border border-border bg-bg-card p-5 flex flex-col items-center justify-center text-center">
          <div className="relative mb-2">
            <ProgressRing progress={d?.level?.progress || 0} size={80} stroke={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{d?.level?.level || 1}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-text-primary">Level {d?.level?.level || 1}</p>
          <p className="text-xs text-text-secondary">{d?.xp || 0} XP</p>
          <div className="w-full mt-2">
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${d?.level?.progress || 0}%` }} />
            </div>
            <p className="text-[10px] text-text-tertiary mt-1">{d?.level?.nextMin - d?.xp || 0} XP to next level</p>
          </div>
        </div>
      </div>

      {/* ── WEEKLY GOAL ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Weekly Goal
          </h3>
          <span className="text-xs text-text-secondary">{d?.weeklyGoal?.completed || 0}/{d?.weeklyGoal?.target || 5} assessments</span>
        </div>
        <div className="h-2.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(((d?.weeklyGoal?.completed || 0) / (d?.weeklyGoal?.target || 5)) * 100, 100)}%` }} />
        </div>
        {((d?.weeklyGoal?.completed || 0) >= (d?.weeklyGoal?.target || 5)) && (
          <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Weekly goal achieved! Great work!</p>
        )}
      </div>

      {/* ── IN PROGRESS ASSESSMENTS ──────────────────── */}
      {d?.pendingAssessments?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" /> In Progress
            </h3>
            <span className="text-xs text-text-secondary">{d.pendingAssessments.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {d.pendingAssessments.map((a) => (
              <button key={a.id} onClick={() => navigate(`/assessments/${a.id}`)} className="flex items-center justify-between px-5 py-3 w-full hover:bg-bg-tertiary/50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-secondary">Started {new Date(a.startedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.difficulty === 'easy' ? 'bg-success/10 text-success' : a.difficulty === 'hard' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                    {a.difficulty}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ──────────────────────────── */}
      {d?.recommended?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" /> Recommended for You
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {d.recommended.map((r) => (
              <button key={r.id} onClick={() => navigate(`/assessments/${r.id}`)} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-bg-tertiary/50 transition-all text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-text-secondary capitalize">{r.type}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${r.difficulty === 'easy' ? 'bg-success/10 text-success' : r.difficulty === 'hard' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{r.difficulty}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS ─────────────────────────────── */}
      {d?.achievements?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-amber-500" /> Achievements ({d.achievements.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {d.achievements.map((a) => (
              <div key={a.id} className={`flex items-center gap-2.5 p-3 rounded-lg ${a.color} border border-border/50`}>
                <span className="text-xl">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{a.title}</p>
                  <p className="text-[10px] text-text-secondary truncate">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVITY HEATMAP ─────────────────────────── */}
      <ActivityHeatmap recentActivity={d?.recentActivity} />

      {/* ── RECENT ACTIVITY ──────────────────────────── */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-border">
          {d?.recentActivity?.length > 0 ? d.recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
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
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No activity yet. Start an assessment to see your progress!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
