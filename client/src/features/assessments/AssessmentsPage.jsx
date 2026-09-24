import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Plus, Brain, Search, Users } from 'lucide-react'
import { useAppSelector } from '@/hooks'
import { notify } from '@/lib/notify'
import { EmptyState } from '@/components/shared'
import ConfirmDialog, { RejectDialog } from '@/components/shared/ConfirmDialog'
import DenseAssessmentCard from './DenseAssessmentCard'

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-bg-tertiary" />
        <div className="h-4 w-16 rounded bg-bg-tertiary" />
      </div>
      <div className="h-4 w-3/4 rounded bg-bg-tertiary" />
      <div className="h-3 w-full rounded bg-bg-tertiary" />
      <div className="flex gap-3">
        <div className="h-3 w-16 rounded bg-bg-tertiary" />
        <div className="h-3 w-16 rounded bg-bg-tertiary" />
        <div className="h-3 w-16 rounded bg-bg-tertiary" />
      </div>
      <div className="h-9 w-full rounded-lg bg-bg-tertiary" />
    </div>
  )
}

export default function AssessmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector((s) => s.auth)
  const isSetter = user?.role === 'setter' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'
  const [activeTab, setActiveTab] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [rejectId, setRejectId] = useState(null)

  const setterTabs = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'pending_approval', label: 'Pending' },
    { key: 'published', label: 'Published' },
  ]

  const adminTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending_approval', label: 'Pending Approval' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' },
  ]

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['setter-assessments', activeTab],
    queryFn: () => {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      return api.get(`/assessments/my?${params}`).then((r) => r.data)
    },
    enabled: isSetter && !isAdmin,
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-assessments'],
    queryFn: () => api.get('/admin/assessments/pending').then((r) => r.data),
    enabled: isAdmin && activeTab === 'pending_approval',
    refetchInterval: 30000,
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['admin-assessments', activeTab],
    queryFn: () => {
      if (activeTab === 'all') return api.get('/assessments').then((r) => r.data)
      if (activeTab === 'rejected') return api.get('/assessments').then((r) => r.data)
      return api.get(`/assessments?status=${activeTab}`).then((r) => r.data)
    },
    enabled: isAdmin && activeTab !== 'pending_approval',
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: publishedData, isLoading: pubLoading } = useQuery({
    queryKey: ['assessments-published'],
    queryFn: () => api.get('/assessments?status=published').then((r) => r.data),
    enabled: !isSetter,
  })

  const { data: userAttemptsData } = useQuery({
    queryKey: ['user-attempts'],
    queryFn: () => api.get('/assessments/attempt/my').then((r) => r.data),
    enabled: !isSetter,
  })

  const attemptMap = useMemo(() => {
    const attempts = userAttemptsData?.data || []
    const map = {}
    for (const att of attempts) {
      const aId = typeof att.assessment === 'object' ? att.assessment?._id : att.assessment
      if (!aId) continue
      if (!map[aId]) {
        map[aId] = {
          _id: att._id,
          status: att.status,
          attemptCount: att.attemptCount || 0,
          remainingAttempts: att.remainingAttempts,
          isUnlimited: att.isUnlimited,
          latestAttempt: att,
        }
      }
      if (att.status === 'in_progress') map[aId].status = 'in_progress'
      if (att.status === 'paused') map[aId].status = 'paused'
      if (att.status === 'completed' && map[aId].status !== 'in_progress' && map[aId].status !== 'paused') map[aId].status = 'completed'
    }
    return map
  }, [userAttemptsData])

  const newAssessmentCount = useMemo(() => {
    if (isSetter) return 0
    const published = publishedData?.data || []
    const lastSeen = localStorage.getItem('assessments_last_seen')
    if (!lastSeen) return published.length
    return published.filter((a) => new Date(a.createdAt) > new Date(lastSeen)).length
  }, [publishedData, isSetter])

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/assessments/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-admin-pending-assessment-count'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      notify.success('Assessment approved successfully')
    },
    onError: (err) => notify.error(err?.response?.data?.message || 'Failed to approve assessment'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/assessments/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-admin-pending-assessment-count'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      notify.success('Assessment rejected')
    },
    onError: (err) => notify.error(err?.response?.data?.message || 'Failed to reject assessment'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/assessments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      setDeleteId(null)
      notify.success('Assessment deleted')
    },
    onError: (err) => notify.error(err?.response?.data?.message || 'Failed to delete assessment'),
  })

  let isLoading, assessments
  if (isAdmin) {
    if (activeTab === 'pending_approval') {
      isLoading = pendingLoading
      assessments = pendingData?.data || []
    } else {
      isLoading = allLoading
      const all = allData?.data?.assessments || allData?.data || []
      assessments = activeTab === 'rejected'
        ? all.filter((a) => a.status === 'draft' && a.rejectionReason)
        : all
    }
  } else {
    isLoading = isSetter ? myLoading : pubLoading
    assessments = isSetter ? (myData?.data?.assessments || myData?.data || []) : (publishedData?.data || [])
  }

  const displayedAssessments = (!isSetter && !isAdmin)
    ? [...assessments]
        .filter((a) => a.title?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
          if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
          if (sortBy === 'easiest') return (a.passingPercentage || 0) - (b.passingPercentage || 0)
          if (sortBy === 'hardest') return (b.passingPercentage || 0) - (a.passingPercentage || 0)
          return 0
        })
    : assessments

  const candidateHiring = !isSetter && !isAdmin
    ? displayedAssessments.filter((a) => a.accessMode === 'restricted')
    : []
  const candidateRegular = !isSetter && !isAdmin
    ? displayedAssessments.filter((a) => a.accessMode !== 'restricted')
    : []

  const handleAction = (action, id, extra) => {
    if (action === 'edit') navigate(`/assessments/${id}/edit`)
    else if (action === 'view') navigate(`/assessments/${id}/preview`)
    else if (action === 'review') navigate(`/admin/reviews/${id}`)
    else if (action === 'attempt') navigate(`/assessments/${id}`)
    else if (action === 'results') navigate(`/admin/restricted-results/${id}`)
    else if (action === 'approve') approveMutation.mutate(id)
    else if (action === 'reject') rejectMutation.mutate({ id, reason: extra })
    else if (action === 'delete') setDeleteId(id)
    else if (action === 'submit-approval') api.post(`/assessments/${id}/submit-approval`).then(() => {
      notify.success('Submitted for approval')
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
    }).catch((err) => {
      notify.error(err?.response?.data?.message || 'Failed to submit assessment')
    })
  }

  const markAssessmentsSeen = () => {
    if (!isSetter && !isAdmin && publishedData?.data?.length) {
      localStorage.setItem('assessments_last_seen', new Date().toISOString())
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
            {isAdmin ? 'Assessment Pipeline' : isSetter ? 'My Assessments' : 'Assessments'}
            {!isSetter && !isAdmin && newAssessmentCount > 0 && (
              <button
                type="button"
                onClick={markAssessmentsSeen}
                className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                title="Mark as seen"
              >
                {newAssessmentCount} New
              </button>
            )}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {isAdmin ? 'Review and manage submitted assessments' : isSetter ? 'Manage your assessments' : 'Browse and attempt assessments'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSetter && !isAdmin && (
            <Button onClick={() => navigate('/assessments/create')}>
              <Plus className="h-4 w-4" /> New Assessment
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" role="tablist" aria-label="Assessment status">
          {adminTabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isSetter && !isAdmin && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" role="tablist" aria-label="Assessment status">
          {setterTabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {!isSetter && !isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Search assessments..." />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="easiest">Easiest</option>
            <option value="hardest">Hardest</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : assessments.length === 0 || (!isSetter && !isAdmin && displayedAssessments.length === 0) ? (
        <EmptyState
          icon={Brain}
          title={isAdmin ? 'No Assessments Found' : isSetter ? 'No Assessments Yet' : (searchQuery ? 'No Matching Assessments' : 'No Assessments Available')}
          description={isAdmin ? 'No assessments found for this filter' : isSetter ? 'Create your first assessment to get started' : (searchQuery ? 'Try adjusting your search query' : 'No published assessments available yet')}
          action={isSetter && !isAdmin ? (
            <Button onClick={() => navigate('/assessments/create')}>
              <Plus className="h-4 w-4" /> Create Assessment
            </Button>
          ) : undefined}
        />
      ) : (
        isSetter || isAdmin ? (
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {assessments.map((a) => (
              <DenseAssessmentCard key={a._id} a={a} role={isAdmin ? 'admin' : 'setter'} onAction={handleAction} onReject={(id) => setRejectId(id)} navigate={navigate} />
            ))}
          </div>
        ) : (
          <>
            {candidateHiring.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-500/90 mb-3 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Hiring Assessments
                </h3>
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {candidateHiring.map((a) => (
                    <DenseAssessmentCard key={a._id} a={a} role="candidate" navigate={navigate} attemptInfo={attemptMap[a._id]} user={user} />
                  ))}
                </div>
              </div>
            )}
            {candidateRegular.length > 0 && (
              <div>
                {candidateHiring.length > 0 && (
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Assessments</h3>
                )}
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {candidateRegular.map((a) => (
                    <DenseAssessmentCard key={a._id} a={a} role="candidate" navigate={navigate} attemptInfo={attemptMap[a._id]} user={user} />
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}

      <RejectDialog
        open={!!rejectId}
        onConfirm={(reason) => { handleAction('reject', rejectId, reason); setRejectId(null) }}
        onCancel={() => setRejectId(null)}
        isPending={rejectMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Assessment"
        message="Are you sure you want to delete this assessment? All attempts and submissions will also be deleted. This action cannot be undone."
        variant="danger"
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
