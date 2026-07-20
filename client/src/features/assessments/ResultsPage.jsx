import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, CheckCircle, XCircle, Clock, BarChart3, Trophy, RefreshCw, Lightbulb, Target, Sparkles, TrendingUp, Loader2, AlertCircle } from 'lucide-react'

export default function ResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['attempt-result', id],
    queryFn: () => api.get(`/assessments/attempt/${id}`).then((r) => r.data),
    refetchInterval: false,
  })

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['quiz-insights', id],
    queryFn: () => api.get(`/ai/quiz/${id}/insights`).then((r) => r.data),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-danger mx-auto" />
        <h2 className="text-xl font-heading font-bold text-text-primary">Failed to Load Results</h2>
        <p className="text-sm text-text-secondary">{error?.response?.data?.message || 'Something went wrong.'}</p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Button>
      </div>
    )
  }

  const result = data?.data
  const attempt = result?.attempt
  const submissions = result?.submissions || []
  const insights = insightsData?.data?.insights

  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-text-tertiary mx-auto opacity-40" />
        <h2 className="text-xl font-heading font-bold text-text-primary">Attempt Not Found</h2>
        <p className="text-sm text-text-secondary">This attempt may have been deleted or doesn't exist.</p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Button>
      </div>
    )
  }

  const formatTime = (s) => {
    if (!s) return '0m'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  const passed = attempt.percentage >= (attempt.assessment?.passingPercentage || 40)
  const isAiQuiz = attempt.assessment?.isAiGenerated
  const hasNegativeMarking = attempt.assessment?.negativeMarking
  const negativeMarkingValue = attempt.assessment?.negativeMarkingValue || 0

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(isAiQuiz ? '/ai-quiz' : '/assessments')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">{attempt.assessment?.title || 'Results'}</h2>
          <p className="mt-1 text-sm text-text-secondary">Assessment completed</p>
        </div>
      </div>

      <div className={`rounded-xl border p-8 text-center ${passed ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'}`}>
        <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full mb-4 ${passed ? 'bg-success/10' : 'bg-danger/10'}`}>
          {passed ? <Trophy className="h-10 w-10 text-success" /> : <XCircle className="h-10 w-10 text-danger" />}
        </div>
        <h3 className={`text-3xl font-heading font-bold ${passed ? 'text-success' : 'text-danger'}`}>
          {passed ? 'Passed!' : 'Failed'}
        </h3>
        <p className="text-5xl font-heading font-bold text-text-primary mt-2">{attempt.percentage}%</p>
        <p className="text-sm text-text-secondary mt-1">{attempt.score} / {attempt.totalMarks} marks</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Correct', value: attempt.correctCount, icon: CheckCircle, color: 'text-success bg-success/10' },
          { label: 'Incorrect', value: attempt.incorrectCount, icon: XCircle, color: 'text-danger bg-danger/10' },
          { label: 'Skipped', value: attempt.unansweredCount, icon: Clock, color: 'text-text-tertiary bg-bg-tertiary' },
          { label: 'Time Spent', value: formatTime(attempt.totalTimeSpent), icon: BarChart3, color: 'text-info bg-info/10' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-bg-card p-4 text-center">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color} mb-2`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {insights && (
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text-primary">AI Insights</h3>
            {insightsLoading && <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />}
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-text-secondary leading-relaxed">{insights.overallAssessment}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-success/5 border border-success/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <h4 className="text-sm font-semibold text-success">Strengths</h4>
                </div>
                <ul className="space-y-1">
                  {insights.strengths?.length > 0 ? insights.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" /> {s}
                    </li>
                  )) : <li className="text-sm text-text-secondary">Keep practicing to build strengths</li>}
                </ul>
              </div>

              <div className="rounded-lg bg-danger/5 border border-danger/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-danger" />
                  <h4 className="text-sm font-semibold text-danger">Weaknesses</h4>
                </div>
                <ul className="space-y-1">
                  {insights.weaknesses?.length > 0 ? insights.weaknesses.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <XCircle className="h-3.5 w-3.5 text-danger mt-0.5 shrink-0" /> {s}
                    </li>
                  )) : <li className="text-sm text-text-secondary">No major weaknesses identified</li>}
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-primary">Recommendations</h4>
              </div>
              <ul className="space-y-1">
                {insights.recommendations?.map((r, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                    <ArrowLeft className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0 rotate-180" /> {r}
                  </li>
                ))}
              </ul>
            </div>

            {insights.focusAreas?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.focusAreas.map((area, i) => (
                    <span key={i} className="rounded-full bg-bg-tertiary px-3 py-1 text-xs text-text-secondary">{area}</span>
                  ))}
                </div>
              </div>
            )}

            {insights.estimatedProficiency && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                Proficiency: <span className={`font-semibold capitalize ${
                  insights.estimatedProficiency === 'advanced' ? 'text-success' :
                  insights.estimatedProficiency === 'intermediate' ? 'text-primary' : 'text-text-secondary'
                }`}>{insights.estimatedProficiency}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {attempt.assessment?.showCorrectAnswers && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-text-primary">Question Review</h3>
          {submissions.map((s, i) => {
            const q = s.question
            if (!q) return null
            return (
              <div key={s._id} className={`rounded-xl border p-5 ${s.isCorrect ? 'border-success/20 bg-success/5' : s.isAnswered ? 'border-danger/20 bg-danger/5' : 'border-border bg-bg-card'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${s.isCorrect ? 'text-success' : s.isAnswered ? 'text-danger' : 'text-text-tertiary'}`}>
                    {s.isCorrect ? <CheckCircle className="h-5 w-5" /> : s.isAnswered ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{i + 1}. {q.title}</p>
                    {q.options?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {q.options.map((opt) => {
                          const isCorrectOpt = opt.isCorrect
                          const isSelected = s.answer === opt.key || (Array.isArray(s.answer) && s.answer.includes(opt.key))
                          return (
                            <span key={opt.key} className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isCorrectOpt ? 'bg-success/10 text-success border border-success/20' :
                              isSelected ? 'bg-danger/10 text-danger border border-danger/20' :
                              'bg-bg-tertiary text-text-secondary'
                            }`}>
                              {opt.key}: {opt.text}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-xs text-text-tertiary mt-1">
                      {s.isAnswered ? `Your answer: ${Array.isArray(s.answer) ? s.answer.join(', ') : s.answer || 'N/A'}` : 'Not answered'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${s.isCorrect ? 'text-success' : s.isAnswered ? 'text-danger' : 'text-text-tertiary'}`}>
                    {s.isCorrect ? `+${q.marks}` : s.isAnswered && hasNegativeMarking ? `-${negativeMarkingValue}` : '0'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(isAiQuiz ? '/ai-quiz' : '/assessments')}>
          <ArrowLeft className="h-4 w-4" /> {isAiQuiz ? 'New AI Quiz' : 'Back to Assessments'}
        </Button>
        {!isAiQuiz && (
          <Button onClick={() => navigate(`/assessments/${attempt.assessment?._id}`)}>
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
