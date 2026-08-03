import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, CheckCircle, XCircle, Clock, Brain, Code2, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

const typeColors = {
  single_correct: 'bg-blue-500/10 text-blue-400',
  multi_correct: 'bg-purple-500/10 text-purple-400',
  true_false: 'bg-green-500/10 text-green-400',
  fill_blanks: 'bg-orange-500/10 text-orange-400',
  coding: 'bg-pink-500/10 text-pink-400',
  subjective: 'bg-yellow-500/10 text-yellow-400',
}

function QuestionCard({ question, status, onApprove, onReject, isPending }) {
  const statusConfig = {
    pending_review: { color: 'bg-warning/10 text-warning', label: 'Pending', icon: Clock },
    approved: { color: 'bg-success/10 text-success', label: 'Approved', icon: CheckCircle },
    rejected: { color: 'bg-danger/10 text-danger', label: 'Rejected', icon: XCircle },
  }
  const cfg = statusConfig[status] || statusConfig.pending_review
  const Icon = cfg.icon

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[question.questionType] || 'bg-bg-tertiary text-text-tertiary'}`}>
              {question.questionType?.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-tertiary capitalize">{question.difficulty}</span>
            <span className="text-xs text-text-tertiary">{question.marks} mark{question.marks > 1 ? 's' : ''}</span>
          </div>
          <p className="text-sm font-medium text-text-primary">{question.title}</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
          <Icon className="h-3 w-3 inline mr-1" />{cfg.label}
        </span>
      </div>

      {question.questionType !== 'coding' && question.questionType !== 'subjective' && question.options && (
        <div className="space-y-1.5">
          {question.options.map((opt) => (
            <div key={opt.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${opt.isCorrect ? 'bg-success/5 border border-success/20' : 'bg-bg-secondary'}`}>
              <span className="font-mono text-xs text-text-tertiary w-5">{opt.key}.</span>
              <span className="flex-1 text-text-primary">{opt.text}</span>
              {opt.isCorrect && <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {question.questionType === 'fill_blanks' && question.correctAnswer && (
        <div className="px-3 py-2 rounded-lg bg-success/5 border border-success/20 text-sm">
          <span className="text-text-tertiary">Correct Answer: </span>
          <span className="text-success font-medium">{question.correctAnswer}</span>
        </div>
      )}

      {status === 'pending_review' && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => onApprove(question._id)} disabled={isPending}
            className="text-success hover:text-success hover:bg-success/10">
            <CheckCircle className="h-4 w-4" /> Approve
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onReject(question._id)} disabled={isPending}
            className="text-danger hover:text-danger hover:bg-danger/10">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AssessmentReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmApproveAll, setConfirmApproveAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['assessment-review', id],
    queryFn: () => api.get(`/assessments/${id}`).then((r) => r.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ questionId, status }) => api.post(`/assessments/${id}/questions/${questionId}/review`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessment-review', id] }),
  })

  const approveAllMutation = useMutation({
    mutationFn: () => api.post(`/assessments/${id}/approve-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-review', id] })
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      setConfirmApproveAll(false)
      navigate('/admin/reviews')
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

  const assessment = data?.data
  if (!assessment) return null

  const questionStatus = assessment.questionStatus || {}
  const allQuestionIds = assessment.sections?.flatMap((s) => s.questions?.map((q) => typeof q === 'string' ? q : q._id) || []) || []
  const approvedCount = allQuestionIds.filter((qId) => questionStatus[qId?.toString()] === 'approved').length
  const rejectedCount = allQuestionIds.filter((qId) => questionStatus[qId?.toString()] === 'rejected').length
  const pendingCount = allQuestionIds.filter((qId) => !questionStatus[qId?.toString()] || questionStatus[qId?.toString()] === 'pending_review').length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/reviews')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold text-text-primary">{assessment.title}</h2>
          <p className="mt-1 text-sm text-text-secondary">Review assessment and individual questions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setConfirmApproveAll(true)} disabled={approveAllMutation.isPending}>
            <CheckCircle className="h-4 w-4" /> Approve All
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${assessment.assessmentType === 'coding' ? 'bg-pink-500/10' : assessment.assessmentType === 'mixed' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
            {assessment.assessmentType === 'coding' ? <Code2 className="h-4 w-4 text-pink-400" /> : <Brain className="h-4 w-4 text-primary" />}
          </div>
          <span className="text-xs font-medium text-text-secondary capitalize bg-bg-tertiary px-2 py-0.5 rounded">{assessment.difficulty}</span>
          <span className="text-xs text-text-tertiary">by {assessment.createdBy?.name || 'Unknown'}</span>
        </div>
        {assessment.description && <p className="text-sm text-text-secondary">{assessment.description}</p>}
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {assessment.passingPercentage}% pass</span>
          <span>{assessment.timeLimit ? `${Math.round(assessment.timeLimit / 60)} min` : 'No limit'}</span>
          <span>{allQuestionIds.length} questions</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {approvedCount > 0 && <span className="text-success font-medium">{approvedCount} approved</span>}
          {rejectedCount > 0 && <span className="text-danger font-medium">{rejectedCount} rejected</span>}
          {pendingCount > 0 && <span className="text-warning font-medium">{pendingCount} pending</span>}
        </div>
      </div>

      <div className="space-y-6">
        {assessment.sections?.map((section, si) => (
          <div key={si} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary">{section.title || `Section ${si + 1}`}</h3>
              <span className="text-xs text-text-tertiary">({section.questions?.length || 0} questions)</span>
            </div>
            <div className="space-y-3">
              {section.questions?.map((q) => {
                const question = typeof q === 'string' ? null : q
                if (!question) return null
                const qId = question._id?.toString()
                const status = questionStatus[qId] || 'pending_review'
                return (
                  <QuestionCard
                    key={qId}
                    question={question}
                    status={status}
                    onApprove={(qId) => reviewMutation.mutate({ questionId: qId, status: 'approved' })}
                    onReject={(qId) => reviewMutation.mutate({ questionId: qId, status: 'rejected' })}
                    isPending={reviewMutation.isPending}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmApproveAll}
        title="Approve All Questions"
        message={`This will approve all ${allQuestionIds.length} questions and publish the assessment. Candidates will be able to take it.`}
        onConfirm={() => approveAllMutation.mutate()}
        onCancel={() => setConfirmApproveAll(false)}
        isPending={approveAllMutation.isPending}
        variant="success"
      />
    </div>
  )
}
