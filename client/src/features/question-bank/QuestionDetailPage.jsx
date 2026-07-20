import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Edit3, Send, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react'
import { CardSkeleton } from '@/components/shared'

const typeLabels = {
  single_correct: 'Single Correct', multi_correct: 'Multi Correct', true_false: 'True/False',
  fill_blanks: 'Fill Blanks', coding: 'Coding', subjective: 'Subjective',
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-500/10 text-amber-400' },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400' },
}

export default function QuestionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get(`/questions/${id}`).then((r) => r.data),
  })

  const submitReview = useMutation({
    mutationFn: () => api.post(`/questions/${id}/submit-review`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question', id] }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ status, rejectionReason }) => api.post(`/questions/${id}/review`, { status, rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question', id] }),
  })

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-4"><CardSkeleton /><CardSkeleton /></div>

  const q = data?.data
  if (!q) return null

  const status = statusConfig[q.status]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/question-bank')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-heading font-bold text-text-primary">{q.title}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">{typeLabels[q.questionType]} &middot; {q.difficulty} &middot; {q.marks} mark{q.marks > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/question-bank/${id}/edit`)}>
            <Edit3 className="h-4 w-4" /> Edit
          </Button>
          {q.status === 'draft' && (
            <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          )}
          {q.status === 'pending_review' && (
            <>
              <Button variant="success" onClick={() => reviewMutation.mutate({ status: 'approved' })}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button variant="danger" onClick={() => {
                const reason = prompt('Rejection reason:')
                if (reason) reviewMutation.mutate({ status: 'rejected', rejectionReason: reason })
              }}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {q.description && (
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
          <p className="text-sm text-text-secondary">{q.description}</p>
        </div>
      )}

      {q.options?.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Options</h3>
          {q.options.map((opt) => (
            <div key={opt.key} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary text-sm font-medium text-text-secondary">{opt.key}</div>
              <p className="text-sm text-text-primary">{opt.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><span className="text-text-tertiary">Version</span><p className="text-text-primary font-medium">v{q.version}</p></div>
          <div><span className="text-text-tertiary">Status</span><p className="text-text-primary font-medium capitalize">{q.status.replace('_', ' ')}</p></div>
          <div><span className="text-text-tertiary">Created</span><p className="text-text-primary font-medium">{new Date(q.createdAt).toLocaleDateString()}</p></div>
          <div><span className="text-text-tertiary">Creator</span><p className="text-text-primary font-medium">{q.createdBy?.name || 'Unknown'}</p></div>
        </div>
      </div>

      {q.status === 'rejected' && q.rejectionReason && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">Rejection Reason</p>
          <p className="text-sm text-text-secondary mt-1">{q.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}
