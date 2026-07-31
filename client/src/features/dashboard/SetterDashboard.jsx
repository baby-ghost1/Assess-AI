import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAppSelector } from '@/hooks'
import { useNavigate } from 'react-router-dom'
import { Brain, FileEdit, BarChart3, ClipboardCheck, Loader2, FileText, BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/shared'

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div onClick={onClick} className={`rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </div>
  )
}

export default function SetterDashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Welcome back, {user?.name?.split(' ')[0] || 'Setter'}</h2>
        <p className="mt-1 text-sm text-text-secondary">Overview of your created content and assessments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Brain} label="Questions Created" value={d?.totalQuestions || 0} color="text-primary bg-primary/10" onClick={() => navigate('/question-bank')} />
        <StatCard icon={FileEdit} label="Assessments Authored" value={d?.totalAssessments || 0} color="text-accent bg-accent/10" onClick={() => navigate('/assessments')} />
        <StatCard icon={BarChart3} label="Total Attempts" value={d?.totalAttempts || 0} color="text-warning bg-warning/10" onClick={() => navigate('/analytics')} />
        <StatCard icon={ClipboardCheck} label="Pending Approvals" value={d?.pendingApprovals || 0} color={d?.pendingApprovals > 0 ? 'text-danger bg-danger/10' : 'text-success bg-success/10'} onClick={() => navigate('/question-bank/approval-queue')} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Assessments
            </h3>
          </div>
          <div className="divide-y divide-border">
            {d?.recentAssessments?.length > 0 ? d.recentAssessments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-secondary">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${a.status === 'published' ? 'bg-success/10 text-success' : a.status === 'draft' ? 'bg-bg-tertiary text-text-secondary' : 'bg-warning/10 text-warning'}`}>
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
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Recent Questions
            </h3>
          </div>
          <div className="divide-y divide-border">
            {questions.length > 0 ? questions.map((q) => (
              <div key={q._id} onClick={() => navigate(`/question-bank/${q._id}`)} className="flex items-center justify-between px-6 py-4 hover:bg-bg-tertiary/50 cursor-pointer transition-colors">
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
      </div>
    </div>
  )
}
