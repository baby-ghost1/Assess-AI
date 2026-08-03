import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAppSelector } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AnimatedNumber from '@/lib/animatedNumber'
import { Button } from '@/components/ui'
import { Brain, FileEdit, BarChart3, ClipboardCheck, Loader2, FileText, BookOpen, PlusCircle, Send, ChevronRight, Eye, Zap } from 'lucide-react'
import { EmptyState } from '@/components/shared'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return { emoji: '🌅', text: 'Good morning' }
  if (hour < 17) return { emoji: '☀️', text: 'Good afternoon' }
  return { emoji: '🌙', text: 'Good evening' }
}

export default function SetterDashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()
  const greeting = getGreeting()

  const { data, isLoading } = useQuery({
    queryKey: ['setter-dashboard'],
    queryFn: () => api.get('/setter/dashboard').then((r) => r.data),
  })

  const { data: recentQuestions } = useQuery({
    queryKey: ['setter-recent-questions'],
    queryFn: () => api.get('/questions?sort=-createdAt&limit=5').then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const d = data?.data
  const questions = recentQuestions?.data || []

  const statusColors = {
    draft: 'bg-zinc-500/10 text-zinc-400',
    pending_review: 'bg-amber-500/10 text-amber-400',
    approved: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
  }

  const stats = [
    { icon: Brain, label: 'Questions Created', value: d?.totalQuestions || 0, color: 'text-primary bg-primary/10', onClick: () => navigate('/question-bank') },
    { icon: FileEdit, label: 'Assessments Authored', value: d?.totalAssessments || 0, color: 'text-accent bg-accent/10', onClick: () => navigate('/assessments') },
    { icon: BarChart3, label: 'Total Attempts', value: d?.totalAttempts || 0, color: 'text-warning bg-warning/10', onClick: () => navigate('/analytics') },
    { icon: ClipboardCheck, label: 'Pending Approvals', value: d?.pendingApprovals || 0, color: d?.pendingApprovals > 0 ? 'text-danger bg-danger/10' : 'text-success bg-success/10', onClick: () => navigate('/question-bank/approval-queue') },
  ]

  const quickActions = [
    { icon: PlusCircle, label: 'Create Question', desc: 'Add a new question to the bank', color: 'text-primary bg-primary/10', onClick: () => navigate('/question-bank/create') },
    { icon: Send, label: 'Create Assessment', desc: 'Build a new assessment', color: 'text-accent bg-accent/10', onClick: () => navigate('/assessments/create') },
    { icon: Eye, label: 'View Submissions', desc: 'Review candidate submissions', color: 'text-warning bg-warning/10', onClick: () => navigate('/submissions') },
  ]

  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">

      {/* ── GREETING SECTION ─────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
              {greeting.emoji} {greeting.text}, {user?.name?.split(' ')[0] || 'Setter'}!
            </h2>
            <p className="text-sm text-text-secondary">Overview of your created content and assessments</p>
          </div>
          <div className="flex items-center gap-3">
            {d?.pendingApprovals > 0 && (
              <Button onClick={() => navigate('/question-bank/approval-queue')} variant="outline" size="sm">
                <ClipboardCheck className="h-4 w-4" /> {d.pendingApprovals} Pending
              </Button>
            )}
            <Button onClick={() => navigate('/question-bank/create')} size="sm">
              <Zap className="h-4 w-4" /> New Question
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── STATS GRID ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={s.onClick}
            className="rounded-xl border border-border bg-bg-card p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          >
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-4.5 w-4.5" /></div>
            <p className="text-2xl font-bold text-text-primary">
              <AnimatedNumber value={s.value} />
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── QUICK ACTIONS ────────────────────────────── */}
      <motion.div variants={fadeUp} className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={a.onClick} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-bg-tertiary/50 transition-all text-left">
              <div className={`h-10 w-10 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{a.label}</p>
                <p className="text-xs text-text-secondary">{a.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── RECENT DATA ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Assessments
            </h3>
          </div>
          <div className="divide-y divide-border">
            {d?.recentAssessments?.length > 0 ? d.recentAssessments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${a.status === 'published' ? 'bg-success/10 text-success' : a.status === 'draft' ? 'bg-bg-tertiary text-text-secondary' : 'bg-warning/10 text-warning'}`}>
                    {a.status}
                  </span>
                  <span className="text-xs text-text-secondary">{a.attempts} attempts</span>
                </div>
              </div>
            )) : (
              <EmptyState icon={FileEdit} title="No Assessments Yet" description="Create your first assessment to get started" className="py-8" />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Recent Questions
            </h3>
          </div>
          <div className="divide-y divide-border">
            {questions.length > 0 ? questions.map((q) => (
              <div key={q._id} onClick={() => navigate(`/question-bank/${q._id}`)} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/50 cursor-pointer transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{q.title}</p>
                  <p className="text-xs text-text-secondary">{q.questionType.replace('_', ' ')} &middot; {q.difficulty}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[q.status] || 'bg-bg-tertiary text-text-secondary'}`}>
                  {q.status.replace('_', ' ')}
                </span>
              </div>
            )) : (
              <EmptyState icon={BookOpen} title="No Questions Yet" description="Create your first question to get started" className="py-8" />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
