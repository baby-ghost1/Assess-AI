import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Trophy, RotateCw, BarChart3, Clock, XCircle } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/shared'

function AttemptCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-bg-tertiary shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-tertiary rounded w-2/3" />
            <div className="flex gap-3">
              <div className="h-3 bg-bg-tertiary rounded w-16" />
              <div className="h-3 bg-bg-tertiary rounded w-12" />
              <div className="h-3 bg-bg-tertiary rounded w-20" />
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <div className="h-6 bg-bg-tertiary rounded w-12 ml-auto" />
          <div className="h-3 bg-bg-tertiary rounded w-16 ml-auto" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border flex justify-between">
        <div className="h-3 bg-bg-tertiary rounded w-32" />
        <div className="flex gap-2">
          <div className="h-7 bg-bg-tertiary rounded w-24" />
          <div className="h-7 bg-bg-tertiary rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export default function MyAttemptsPage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get('/assessments/attempt/my').then((r) => r.data),
  })

  const attempts = data?.data || []

  const formatTime = (s) => {
    if (!s) return '0m'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assessments')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">My Attempts</h2>
          <p className="mt-1 text-sm text-text-secondary">View your assessment history</p>
        </div>
      </div>

      {error && <ErrorState error={error} title="Failed to Load Attempts" />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <AttemptCardSkeleton key={i} />)}
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Attempts Yet"
          description="Start an assessment to see your history here"
          actionLabel="Browse Assessments"
          onAction={() => navigate('/assessments')}
        />
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const passed = a.percentage >= (a.assessment?.passingPercentage || 40)
            const assessment = a.assessment
            return (
              <div key={a._id} className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${passed ? 'bg-success/10' : 'bg-danger/10'}`}>
                      {passed ? <Trophy className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-danger" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{assessment?.title || 'Unknown Assessment'}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                        <span className={`px-1.5 py-0.5 rounded font-medium capitalize ${
                          assessment?.difficulty === 'easy' ? 'bg-success/10 text-success' :
                          assessment?.difficulty === 'hard' ? 'bg-danger/10 text-danger' :
                          'bg-warning/10 text-warning'
                        }`}>{assessment?.difficulty}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(a.totalTimeSpent)}</span>
                        <span>{a.correctCount}/{a.correctCount + a.incorrectCount + a.unansweredCount} correct</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${passed ? 'text-success' : 'text-danger'}`}>{a.percentage}%</p>
                      <p className="text-[10px] text-text-tertiary">{a.score}/{a.totalMarks} marks</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-[10px] text-text-tertiary">{new Date(a.createdAt).toLocaleDateString()} · {new Date(a.createdAt).toLocaleTimeString()}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/results/${a._id}`)}>
                      <BarChart3 className="h-3 w-3" /> View Results
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/assessments/${assessment?._id}`)}>
                      <RotateCw className="h-3 w-3" /> Retake
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
