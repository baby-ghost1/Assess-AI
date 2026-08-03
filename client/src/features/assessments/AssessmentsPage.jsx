import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Plus, Brain, Code2, Clock, BarChart3, CheckCircle, Send, FileEdit, XCircle, Eye, Loader2, Trash2, Search } from 'lucide-react'
import { useAppSelector } from '@/hooks'
import { notify } from '@/lib/notify'
import { EmptyState } from '@/components/shared'
import ConfirmDialog, { RejectDialog } from '@/components/shared/ConfirmDialog'

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

const statusConfig = {
  draft: { color: 'bg-text-tertiary/10 text-text-tertiary', label: 'Draft', icon: FileEdit },
  pending_approval: { color: 'bg-warning/10 text-warning', label: 'Pending', icon: Clock },
  approved: { color: 'bg-success/10 text-success', label: 'Approved', icon: CheckCircle },
  published: { color: 'bg-success/10 text-success', label: 'Published', icon: CheckCircle },
  rejected: { color: 'bg-danger/10 text-danger', label: 'Rejected', icon: XCircle },
}

const formatTime = (min) => {
  if (!min) return 'No limit'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const getQuestionCount = (a) => a.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0

function AdminStatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.draft
  const Icon = cfg.icon
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="h-3 w-3 inline mr-1" />{cfg.label}
    </span>
  )
}

function AdminAssessmentCard({ a, onAction }) {
  const qCount = getQuestionCount(a)
  const [showReject, setShowReject] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${a.assessmentType === 'coding' ? 'bg-pink-500/10' : a.assessmentType === 'mixed' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
          {a.assessmentType === 'coding' ? <Code2 className="h-4 w-4 text-pink-400" /> : <Brain className="h-4 w-4 text-primary" />}
        </div>
        <AdminStatusBadge status={a.status} />
        {a.status === 'draft' && a.rejectionReason && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger/10 text-danger">
            <XCircle className="h-3 w-3 inline mr-1" />Rejected
          </span>
        )}
        <span className="text-xs text-text-tertiary capitalize bg-bg-tertiary px-2 py-0.5 rounded">{a.difficulty}</span>
      </div>

      <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">{a.title}</h3>
      {a.description && <p className="text-xs text-text-secondary mb-3 line-clamp-2">{a.description}</p>}

      {a.createdBy && (
        <p className="text-xs text-text-tertiary mb-3">
          Created by <span className="font-medium text-text-secondary">{a.createdBy.name}</span> ({a.createdBy.email})
        </p>
      )}

      {a.status === 'draft' && a.rejectionReason && (
        <div className="rounded-lg bg-danger/5 border border-danger/10 px-3 py-2 mb-3">
          <p className="text-[11px] text-danger font-medium">Rejection Reason</p>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{a.rejectionReason}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(a.timeLimit)}</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {a.passingPercentage}% pass</span>
        {qCount > 0 && <span>{qCount} questions</span>}
      </div>

      <div className="flex gap-2">
        {a.status === 'pending_approval' && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('review', a._id)}>
              <Eye className="h-4 w-4" /> Review
            </Button>
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onAction('approve', a._id)}>
              <CheckCircle className="h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => setShowReject(true)}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </>
        )}
        {a.status === 'published' && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('view', a._id)}>
              <Eye className="h-4 w-4" /> View
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => onAction('delete', a._id)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        )}
        {a.status === 'draft' && !a.rejectionReason && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('view', a._id)}>
              <Eye className="h-4 w-4" /> View
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => onAction('delete', a._id)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        )}
        {a.status === 'draft' && a.rejectionReason && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('view', a._id)}>
              <Eye className="h-4 w-4" /> View
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => onAction('delete', a._id)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        )}
      </div>

      <RejectDialog
        open={showReject}
        onConfirm={(reason) => { onAction('reject', a._id, reason); setShowReject(false) }}
        onCancel={() => setShowReject(false)}
        isPending={false}
      />
    </div>
  )
}

function SetterAssessmentCard({ a, onAction }) {
  const isRejected = a.status === 'draft' && a.rejectionReason
  const cfg = isRejected ? statusConfig.rejected : (statusConfig[a.status] || statusConfig.draft)
  const Icon = cfg.icon
  const qCount = a.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post(`/assessments/${a._id}/submit-approval`)
      onAction('refresh')
    } catch {
      // error handled by UI
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${a.assessmentType === 'coding' ? 'bg-pink-500/10' : a.assessmentType === 'mixed' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
          {a.assessmentType === 'coding' ? <Code2 className="h-4 w-4 text-pink-400" /> : <Brain className="h-4 w-4 text-primary" />}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
          <Icon className="h-3 w-3 inline mr-1" />{cfg.label}
        </span>
        <span className="text-xs text-text-tertiary capitalize bg-bg-tertiary px-2 py-0.5 rounded">{a.difficulty}</span>
      </div>

      <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">{a.title}</h3>
      {a.description && <p className="text-xs text-text-secondary mb-3 line-clamp-2">{a.description}</p>}

      {isRejected && (
        <div className="rounded-lg bg-danger/5 border border-danger/10 px-3 py-2 mb-3">
          <p className="text-[11px] text-danger font-medium">Rejection Reason</p>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{a.rejectionReason}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.timeLimit ? `${Math.round(a.timeLimit / 60)} min` : 'No limit'}</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {a.passingPercentage}% pass</span>
        <span>{qCount} questions</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('view', a._id)}>
          <Eye className="h-4 w-4" /> View
        </Button>
        {a.status === 'draft' && (
          <>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onAction('edit', a._id)}>
              <FileEdit className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={submitting || qCount === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? '...' : 'Submit'}
            </Button>
          </>
        )}
        {a.status === 'pending_approval' && (
          <Button size="sm" variant="secondary" className="flex-1" disabled>
            <Clock className="h-4 w-4" /> Awaiting Approval
          </Button>
        )}
        {a.status === 'published' && (
          <Button size="sm" className="flex-1" onClick={() => onAction('attempt', a._id)}>
            <Eye className="h-4 w-4" /> Open
          </Button>
        )}
      </div>
    </div>
  )
}

function CandidateCard({ a, navigate }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${a.assessmentType === 'coding' ? 'bg-pink-500/10' : a.assessmentType === 'mixed' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
          {a.assessmentType === 'coding' ? <Code2 className="h-4 w-4 text-pink-400" /> : <Brain className="h-4 w-4 text-primary" />}
        </div>
        <span className="text-xs font-medium text-text-secondary capitalize bg-bg-tertiary px-2 py-0.5 rounded">{a.difficulty}</span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">{a.title}</h3>
      {a.description && <p className="text-xs text-text-secondary mb-3 line-clamp-2">{a.description}</p>}
      <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.timeLimit ? `${Math.round(a.timeLimit / 60)} min` : 'No limit'}</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {a.passingPercentage}% pass</span>
        <span>{a.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0)} questions</span>
      </div>
      <Button size="sm" className="w-full" onClick={() => navigate(`/assessments/${a._id}`)}>
        <Eye className="h-4 w-4" /> Start Assessment
      </Button>
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
    refetchOnWindowFocus: true,
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['admin-assessments', activeTab],
    queryFn: () => {
      if (activeTab === 'all') return api.get('/assessments').then((r) => r.data)
      if (activeTab === 'rejected') return api.get('/assessments').then((r) => r.data)
      return api.get(`/assessments?status=${activeTab}`).then((r) => r.data)
    },
    enabled: isAdmin && activeTab !== 'pending_approval',
    refetchOnWindowFocus: true,
  })

  const { data: publishedData, isLoading: pubLoading } = useQuery({
    queryKey: ['assessments-published'],
    queryFn: () => api.get('/assessments?status=published').then((r) => r.data),
    enabled: !isSetter,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/assessments/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      notify.success('Assessment approved successfully')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/assessments/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      notify.success('Assessment rejected')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/assessments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      setDeleteId(null)
      notify.success('Assessment deleted')
    },
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

  const handleAction = (action, id, extra) => {
    if (action === 'edit') navigate(`/assessments/${id}/edit`)
    else if (action === 'view') navigate(`/assessments/${id}/preview`)
    else if (action === 'review') navigate(`/admin/reviews/${id}`)
    else if (action === 'attempt') navigate(`/assessments/${id}`)
    else if (action === 'approve') approveMutation.mutate(id)
    else if (action === 'reject') rejectMutation.mutate({ id, reason: extra })
    else if (action === 'delete') setDeleteId(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">
            {isAdmin ? 'Assessment Pipeline' : isSetter ? 'My Assessments' : 'Assessments'}
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
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {adminTabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isSetter && !isAdmin && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {setterTabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
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
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="easiest">Easiest</option>
            <option value="hardest">Hardest</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(isSetter || isAdmin ? assessments : displayedAssessments).map((a) => (
            isAdmin ? (
              <AdminAssessmentCard key={a._id} a={a} onAction={handleAction} />
            ) : isSetter ? (
              <SetterAssessmentCard key={a._id} a={a} onAction={handleAction} />
            ) : (
              <CandidateCard key={a._id} a={a} navigate={navigate} />
            )
          ))}
        </div>
      )}

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
