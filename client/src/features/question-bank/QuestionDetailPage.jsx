import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Edit3, Send, CheckCircle, XCircle, Clock, BookOpen, Undo2, History, X, AlertTriangle } from 'lucide-react'
import { CardSkeleton } from '@/components/shared'
import { useAppSelector } from '@/hooks'
import { useState } from 'react'

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

function RejectModal({ open, onConfirm, onCancel, isPending }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-bg-card p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Reject Question</h3>
            <p className="text-sm text-text-secondary">Provide a reason for rejection</p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Why is this question being rejected?"
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} disabled={!reason.trim() || isPending}>
            {isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, isPending, variant = 'primary' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-bg-card p-6 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [showVersions, setShowVersions] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get(`/questions/${id}`).then((r) => r.data),
  })

  const { data: versionsData } = useQuery({
    queryKey: ['question-versions', id],
    queryFn: () => api.get(`/questions/${id}/versions`).then((r) => r.data),
    enabled: showVersions,
  })

  const submitReview = useMutation({
    mutationFn: () => api.post(`/questions/${id}/submit-review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const withdrawReview = useMutation({
    mutationFn: () => api.post(`/questions/${id}/withdraw-review`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ status, rejectionReason }) => api.post(`/questions/${id}/review`, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['questions-approval'] })
    },
  })

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-4"><CardSkeleton /><CardSkeleton /></div>

  const q = data?.data
  if (!q) return null

  const status = statusConfig[q.status]
  const versions = versionsData?.data || []

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
          {q.status === 'draft' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/question-bank/${id}/edit`)}>
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => setConfirmModal({ title: 'Submit for Review', message: 'Are you sure you want to submit this question for review?', onConfirm: () => { submitReview.mutate(); setConfirmModal(null) }, variant: 'primary' })} disabled={submitReview.isPending}>
                <Send className="h-4 w-4" /> Submit for Review
              </Button>
            </>
          )}
          {q.status === 'rejected' && (
            <>
              <Button variant="secondary" onClick={() => navigate(`/question-bank/${id}/edit`)}>
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => setConfirmModal({ title: 'Resubmit for Review', message: 'Are you sure you want to resubmit this question for review?', onConfirm: () => { submitReview.mutate(); setConfirmModal(null) }, variant: 'primary' })} disabled={submitReview.isPending}>
                <Send className="h-4 w-4" /> Resubmit
              </Button>
            </>
          )}
          {q.status === 'pending_review' && (
            <>
              {q.createdBy?._id === user?._id && (
                <Button variant="secondary" onClick={() => setConfirmModal({ title: 'Withdraw from Review', message: 'Are you sure you want to withdraw this question from review?', onConfirm: () => { withdrawReview.mutate(); setConfirmModal(null) }, variant: 'secondary' })} disabled={withdrawReview.isPending}>
                  <Undo2 className="h-4 w-4" /> Withdraw
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button variant="success" onClick={() => setConfirmModal({ title: 'Approve Question', message: 'Are you sure you want to approve this question?', onConfirm: () => { reviewMutation.mutate({ status: 'approved' }); setConfirmModal(null) }, variant: 'success' })}>
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="danger" onClick={() => setRejectModalOpen(true)}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </>
              )}
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
            <div key={opt.key} className={`flex items-center gap-3 p-3 rounded-lg ${opt.isCorrect ? 'bg-success/5 border border-success/20' : 'bg-bg-secondary'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium shrink-0 ${opt.isCorrect ? 'bg-success/20 text-success' : 'bg-bg-tertiary text-text-secondary'}`}>{opt.key}</div>
              <p className="text-sm text-text-primary flex-1">{opt.text}</p>
              {opt.isCorrect && (
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Correct</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Details</h3>
          <button onClick={() => setShowVersions(!showVersions)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <History className="h-3.5 w-3.5" /> {showVersions ? 'Hide' : 'Show'} Version History
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><span className="text-text-tertiary">Version</span><p className="text-text-primary font-medium">v{q.version}</p></div>
          <div><span className="text-text-tertiary">Status</span><p className="text-text-primary font-medium capitalize">{q.status.replace('_', ' ')}</p></div>
          <div><span className="text-text-tertiary">Created</span><p className="text-text-primary font-medium">{new Date(q.createdAt).toLocaleDateString()}</p></div>
          <div><span className="text-text-tertiary">Creator</span><p className="text-text-primary font-medium">{q.createdBy?.name || 'Unknown'}</p></div>
        </div>

        {showVersions && versions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Version History</h4>
            {versions.map((v) => (
              <div key={v._id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary text-sm">
                <span className="text-text-primary font-medium">v{v.version}</span>
                <span className="text-text-secondary">{v.changes}</span>
                <span className="text-text-tertiary ml-auto">{new Date(v.createdAt).toLocaleDateString()}</span>
                <span className="text-text-tertiary">by {v.changedBy?.name || 'Unknown'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {q.status === 'rejected' && q.rejectionReason && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">Rejection Reason</p>
          <p className="text-sm text-text-secondary mt-1">{q.rejectionReason}</p>
        </div>
      )}

      <RejectModal
        open={rejectModalOpen}
        onConfirm={(reason) => { reviewMutation.mutate({ status: 'rejected', rejectionReason: reason }); setRejectModalOpen(false) }}
        onCancel={() => setRejectModalOpen(false)}
        isPending={reviewMutation.isPending}
      />

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
        isPending={reviewMutation.isPending || submitReview.isPending || withdrawReview.isPending}
        variant={confirmModal?.variant}
      />
    </div>
  )
}
