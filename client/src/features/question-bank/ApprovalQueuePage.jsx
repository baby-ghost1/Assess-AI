import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { CheckCircle, XCircle, Clock, Eye, BookOpen } from 'lucide-react'
import { TableSkeleton } from '@/components/shared'
import { useState } from 'react'

const typeColors = {
  single_correct: 'bg-blue-500/10 text-blue-400',
  multi_correct: 'bg-purple-500/10 text-purple-400',
  true_false: 'bg-green-500/10 text-green-400',
  fill_blanks: 'bg-orange-500/10 text-orange-400',
  coding: 'bg-pink-500/10 text-pink-400',
  subjective: 'bg-yellow-500/10 text-yellow-400',
}

export default function ApprovalQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['questions-approval'],
    queryFn: () => api.get('/questions?status=pending_review&limit=50').then((r) => r.data),
    refetchInterval: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/questions/${id}/review`, { status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions-approval'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }) => api.post(`/questions/${id}/review`, { status: 'rejected', rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions-approval'] }),
  })

  const handleReject = (id) => {
    const r = reason[id] || ''
    if (!r.trim()) {
      setReason({ ...reason, [id]: '' })
      return
    }
    rejectMutation.mutate({ id, rejectionReason: r })
  }

  const questions = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Approval Queue</h2>
        <p className="mt-1 text-sm text-text-secondary">Review questions submitted by problem setters</p>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : questions.length === 0 ? (
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
                  <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(q._id)} disabled={approveMutation.isPending}
                    className="text-success hover:text-success hover:bg-success/10">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => handleReject(q._id)}
                    disabled={rejectMutation.isPending}
                    className="text-danger hover:text-danger hover:bg-danger/10">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={reason[q._id] || ''}
                  onChange={(e) => setReason({ ...reason, [q._id]: e.target.value })}
                  placeholder="Rejection reason (required for reject)..."
                  className="flex-1 rounded-lg border border-border bg-bg-secondary py-1.5 px-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {reason[q._id] && (
                  <button onClick={() => handleReject(q._id)}
                    className="text-xs text-danger hover:underline shrink-0">
                    Reject with reason
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
