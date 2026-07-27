import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Send, Loader2, Brain, Code2, Clock, BarChart3, Edit, AlertCircle, CheckCircle } from 'lucide-react'

export default function AssessmentPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`).then((r) => r.data),
  })

  const assessment = data?.data

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/assessments/${id}/submit-approval`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      navigate('/assessments')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-bg-tertiary" />
          <div className="h-64 rounded-xl bg-bg-tertiary" />
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => navigate('/assessments')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-danger mx-auto mb-4" />
          <p className="text-sm text-danger">Failed to load assessment</p>
          <Button className="mt-4" onClick={() => navigate('/assessments')}>Back to Assessments</Button>
        </div>
      </div>
    )
  }

  const totalQuestions = assessment.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0
  const isDraft = assessment.status === 'draft'
  const isPending = assessment.status === 'pending_approval'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assessments')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold text-text-primary">Assessment Review</h2>
          <p className="mt-1 text-sm text-text-secondary">Review all questions before submitting for approval</p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/assessments/${id}/edit`)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || totalQuestions === 0}>
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit for Review
              </Button>
            </>
          )}
          {isPending && (
            <span className="flex items-center gap-2 text-sm text-warning font-medium px-4 py-2 rounded-lg bg-warning/10">
              <Clock className="h-4 w-4" /> Awaiting Admin Review
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${assessment.assessmentType === 'coding' ? 'bg-pink-500/10' : 'bg-primary/10'}`}>
            {assessment.assessmentType === 'coding' ? <Code2 className="h-4 w-4 text-pink-400" /> : <Brain className="h-4 w-4 text-primary" />}
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDraft ? 'bg-text-tertiary/10 text-text-tertiary' : isPending ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
            {isDraft ? 'Draft' : isPending ? 'Pending Review' : assessment.status}
          </span>
          <span className="text-xs text-text-tertiary capitalize">{assessment.difficulty}</span>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{assessment.title}</h3>
        {assessment.description && <p className="text-sm text-text-secondary">{assessment.description}</p>}
        <div className="flex items-center gap-4 text-sm text-text-tertiary">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {assessment.timeLimit ? `${Math.round(assessment.timeLimit / 60)} min` : 'No limit'}</span>
          <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> {assessment.passingPercentage}% pass</span>
          <span>{totalQuestions} questions</span>
          <span>{assessment.maxAttempts} attempt(s)</span>
        </div>
      </div>

      {totalQuestions === 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-warning mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No questions in this assessment yet.</p>
          <Button className="mt-3" variant="secondary" onClick={() => navigate(`/assessments/${id}/edit`)}>
            <Edit className="h-4 w-4" /> Add Questions
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Questions ({totalQuestions})</h3>
        {assessment.sections?.map((section, si) => (
          <div key={si} className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">{section.title || `Section ${si + 1}`}</h4>
              <span className="text-xs text-text-tertiary">{section.questions?.length || 0} questions</span>
            </div>
            {section.questions?.length > 0 ? (
              <div className="space-y-3">
                {section.questions.map((question, qi) => {
                  const q = typeof question === 'string' ? { title: 'Question not loaded', _id: question } : question
                  return (
                    <div key={qi} className="rounded-lg border border-border bg-bg-secondary p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{q.questionType?.replace('_', ' ') || 'Unknown'}</span>
                            <span className="text-[10px] text-text-tertiary capitalize">{q.difficulty || 'medium'}</span>
                            <span className="text-[10px] text-text-tertiary">{q.marks || 1} mark{(q.marks || 1) !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-sm text-text-primary font-medium">{qi + 1}. {q.title}</p>
                          {q.description && <p className="text-xs text-text-secondary mt-1 italic">{q.description}</p>}
                        </div>
                      </div>
                      {q.options?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${opt.isCorrect ? 'bg-success/10 border border-success/20 text-success font-medium' : 'bg-bg-tertiary text-text-secondary'}`}>
                              <span className="font-bold w-5">{opt.key}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {opt.isCorrect && <CheckCircle className="h-3 w-3 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.correctAnswer && !q.options?.length && (
                        <div className="text-xs px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-success ml-6">
                          <span className="font-medium">Answer:</span> {typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary text-center py-4">No questions in this section</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="secondary" onClick={() => navigate('/assessments')}>Back to Assessments</Button>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(`/assessments/${id}/edit`)} disabled={submitMutation.isPending}>
              <Edit className="h-4 w-4" /> Edit Assessment
            </Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || totalQuestions === 0}>
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Review
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
