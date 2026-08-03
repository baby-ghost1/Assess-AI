import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { CheckCircle, XCircle, Clock, Eye, BarChart3 } from 'lucide-react'
import { TableSkeleton, EmptyState } from '@/components/shared'
import ConfirmDialog, { RejectDialog } from '@/components/shared/ConfirmDialog'
import { notify } from '@/lib/notify'
import { useState } from 'react'

export default function AssessmentReviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState(null)
  const [confirmApprove, setConfirmApprove] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['assessments-pending'],
    queryFn: () => api.get('/admin/assessments/pending').then((r) => r.data),
    refetchInterval: 30000,
  })

  const approveAllMutation = useMutation({
    mutationFn: (id) => api.post(`/assessments/${id}/approve-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      setConfirmApprove(null)
      notify.success('Assessment approved successfully')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/assessments/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      setRejectTarget(null)
      notify.success('Assessment rejected')
    },
  })

  const assessments = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Review Queue</h2>
        <p className="mt-1 text-sm text-text-secondary">Assessments submitted by setters for your review</p>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : assessments.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All Caught Up!"
          description="No assessments pending review. Check back later."
        />
      ) : (
        <div className="space-y-4">
          {assessments.map((a) => {
            const qCount = a.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0
            const questionStatus = a.questionStatus || {}
            const approvedCount = Object.values(questionStatus).filter((s) => s === 'approved').length
            const rejectedCount = Object.values(questionStatus).filter((s) => s === 'rejected').length
            const pendingCount = Object.values(questionStatus).filter((s) => s === 'pending_review').length

            return (
              <div key={a._id} className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-semibold text-text-primary truncate">{a.title}</p>
                    </div>
                    {a.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        a.assessmentType === 'coding' ? 'bg-pink-500/10 text-pink-400' :
                        a.assessmentType === 'mixed' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-primary/10 text-primary'
                      }`}>{a.assessmentType}</span>
                      <span className="capitalize">{a.difficulty}</span>
                      <span>{qCount} questions</span>
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {a.passingPercentage}% pass</span>
                      <span>{a.timeLimit ? `${Math.round(a.timeLimit / 60)} min` : 'No limit'}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">by {a.createdBy?.name || 'Unknown'}</p>

                    {qCount > 0 && (
                      <div className="flex items-center gap-3 mt-2 text-[11px]">
                        {approvedCount > 0 && <span className="text-success">{approvedCount} approved</span>}
                        {rejectedCount > 0 && <span className="text-danger">{rejectedCount} rejected</span>}
                        {pendingCount > 0 && <span className="text-warning">{pendingCount} pending</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/reviews/${a._id}`)}
                      className="text-text-secondary hover:text-primary hover:bg-primary/10">
                      <Eye className="h-4 w-4" /> Review
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmApprove({ id: a._id })}
                      className="text-success hover:text-success hover:bg-success/10">
                      <CheckCircle className="h-4 w-4" /> Approve All
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => setRejectTarget(a._id)}
                      className="text-danger hover:text-danger hover:bg-danger/10">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmApprove}
        title="Approve Assessment"
        message="This will approve all questions and publish the assessment. Candidates will be able to take it."
        onConfirm={() => approveAllMutation.mutate(confirmApprove.id)}
        onCancel={() => setConfirmApprove(null)}
        isPending={approveAllMutation.isPending}
        variant="success"
      />

      <RejectDialog
        open={!!rejectTarget}
        onConfirm={(reason) => rejectMutation.mutate({ id: rejectTarget, reason })}
        onCancel={() => setRejectTarget(null)}
        isPending={rejectMutation.isPending}
      />
    </div>
  )
}
