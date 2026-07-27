import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { CheckCircle, XCircle, Clock, Eye, BookOpen, AlertTriangle, Send, Undo2 } from 'lucide-react'
import { TableSkeleton } from '@/components/shared'
import { useState } from 'react'
import { useAppSelector } from '@/hooks'

const typeColors = {
  single_correct: 'bg-blue-500/10 text-blue-400',
  multi_correct: 'bg-purple-500/10 text-purple-400',
  true_false: 'bg-green-500/10 text-green-400',
  fill_blanks: 'bg-orange-500/10 text-orange-400',
  coding: 'bg-pink-500/10 text-pink-400',
  subjective: 'bg-yellow-500/10 text-yellow-400',
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, isPending, variant = 'primary' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-xl border border-border bg-bg-card p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-danger/10' : 'bg-success/10'}`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-danger' : 'text-success'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary">{message}</p>
          </div>
        </div>
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

export default function ApprovalQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'
  const [rejectTarget, setRejectTarget] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')

  const { data: myPendingData, isLoading: myPendingLoading } = useQuery({
    queryKey: ['questions-approval', 'my-pending'],
    queryFn: () => api.get(`/questions?status=pending_review&createdBy=${user?._id}&limit=50`).then((r) => r.data),
    enabled: !isAdmin,
  })

  const { data: myDraftData, isLoading: myDraftLoading } = useQuery({
    queryKey: ['questions-approval', 'my-draft'],
    queryFn: () => api.get(`/questions?status=draft&createdBy=${user?._id}&limit=50`).then((r) => r.data),
    enabled: !isAdmin,
  })

  const { data: myRejectedData, isLoading: myRejectedLoading } = useQuery({
    queryKey: ['questions-approval', 'my-rejected'],
    queryFn: () => api.get(`/questions?status=rejected&createdBy=${user?._id}&limit=50`).then((r) => r.data),
    enabled: !isAdmin,
  })

  const { data: allPendingData, isLoading: allPendingLoading } = useQuery({
    queryKey: ['questions-approval', 'all-pending'],
    queryFn: () => api.get('/questions?status=pending_review&limit=50').then((r) => r.data),
    enabled: isAdmin,
    refetchInterval: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/questions/${id}/review`, { status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions-approval'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }) => api.post(`/questions/${id}/review`, { status: 'rejected', rejectionReason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['questions-approval'] }); setRejectTarget(null) },
  })

  const withdrawMutation = useMutation({
    mutationFn: (id) => api.post(`/questions/${id}/withdraw-review`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions-approval'] }),
  })

  if (isAdmin) {
    const questions = allPendingData?.data || []
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Approval Queue</h2>
          <p className="mt-1 text-sm text-text-secondary">Review questions submitted by problem setters</p>
        </div>

        {allPendingLoading ? <TableSkeleton rows={5} /> : questions.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-card py-16 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-text-secondary text-sm">All caught up! No questions pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q._id} className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-semibold text-text-primary truncate">{q.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[q.questionType]}`}>{q.questionType.replace('_', ' ')}</span>
                      <span>{q.difficulty}</span>
                      <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                      <span>by {q.createdBy?.name || 'Unknown'}</span>
                    </div>
                    {q.category && <p className="text-xs text-text-tertiary mt-1">Category: {q.category}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/question-bank/${q._id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ id: q._id, type: 'approve' })}
                      className="text-success hover:text-success hover:bg-success/10">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => setRejectTarget(q._id)}
                      className="text-danger hover:text-danger hover:bg-danger/10">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          open={!!confirmAction}
          title="Approve Question"
          message="Are you sure you want to approve this question?"
          onConfirm={() => { approveMutation.mutate(confirmAction.id); setConfirmAction(null) }}
          onCancel={() => setConfirmAction(null)}
          isPending={approveMutation.isPending}
          variant="success"
        />

        <RejectModal
          open={!!rejectTarget}
          onConfirm={(reason) => { rejectMutation.mutate({ id: rejectTarget, rejectionReason: reason }) }}
          onCancel={() => setRejectTarget(null)}
          isPending={rejectMutation.isPending}
        />
      </div>
    )
  }

  const tabs = [
    { key: 'pending', label: 'Pending Review', count: myPendingData?.data?.length || 0, loading: myPendingLoading },
    { key: 'draft', label: 'Drafts', count: myDraftData?.data?.length || 0, loading: myDraftLoading },
    { key: 'rejected', label: 'Rejected', count: myRejectedData?.data?.length || 0, loading: myRejectedLoading },
  ]

  const currentData = activeTab === 'pending' ? myPendingData : activeTab === 'draft' ? myDraftData : myRejectedData
  const currentLoading = activeTab === 'pending' ? myPendingLoading : activeTab === 'draft' ? myDraftLoading : myRejectedLoading
  const questions = currentData?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">My Submissions</h2>
        <p className="mt-1 text-sm text-text-secondary">Track the status of your question submissions</p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-bg-secondary rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-bg-tertiary text-text-tertiary'
            }`}>
              {tab.loading ? '...' : tab.count}
            </span>
          </button>
        ))}
      </div>

      {currentLoading ? <TableSkeleton rows={5} /> : questions.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card py-16 text-center">
          {activeTab === 'pending' ? (
            <>
              <Send className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary text-sm">No questions pending review</p>
              <p className="text-xs text-text-tertiary mt-1">Submit a draft question for admin review</p>
            </>
          ) : activeTab === 'draft' ? (
            <>
              <BookOpen className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary text-sm">No draft questions</p>
              <p className="text-xs text-text-tertiary mt-1">Create a new question to get started</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-text-secondary text-sm">No rejected questions</p>
              <p className="text-xs text-text-tertiary mt-1">All your questions are in good standing</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q._id} className="rounded-xl border border-border bg-bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {activeTab === 'pending' && <Clock className="h-4 w-4 text-amber-400" />}
                    {activeTab === 'draft' && <BookOpen className="h-4 w-4 text-zinc-400" />}
                    {activeTab === 'rejected' && <XCircle className="h-4 w-4 text-red-400" />}
                    <p className="text-sm font-semibold text-text-primary truncate">{q.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[q.questionType]}`}>{q.questionType.replace('_', ' ')}</span>
                    <span>{q.difficulty}</span>
                    <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                    <span>v{q.version}</span>
                  </div>
                  {q.category && <p className="text-xs text-text-tertiary mt-1">Category: {q.category}</p>}
                  {activeTab === 'rejected' && q.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Reason: {q.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/question-bank/${q._id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {activeTab === 'pending' && q.createdBy?._id === user?._id && (
                    <Button variant="ghost" size="sm" onClick={() => withdrawMutation.mutate(q._id)} disabled={withdrawMutation.isPending}
                      className="text-text-secondary hover:text-warning hover:bg-warning/10">
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                  {(activeTab === 'draft' || activeTab === 'rejected') && (
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/question-bank/${q._id}/edit`)}
                      className="text-text-secondary hover:text-primary hover:bg-primary/10">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
