import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Plus, Search, Upload, Sparkles, BookOpen, CheckCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { TableSkeleton, EmptyState } from '@/components/shared'
import { useAppSelector } from '@/hooks'
import { notify } from '@/lib/notify'

const typeColors = {
  single_correct: 'bg-blue-500/10 text-blue-400',
  multi_correct: 'bg-purple-500/10 text-purple-400',
  true_false: 'bg-green-500/10 text-green-400',
  fill_blanks: 'bg-orange-500/10 text-orange-400',
  coding: 'bg-pink-500/10 text-pink-400',
  subjective: 'bg-yellow-500/10 text-yellow-400',
}

const statusColors = {
  draft: 'bg-zinc-500/10 text-zinc-400',
  pending_review: 'bg-amber-500/10 text-amber-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  archived: 'bg-zinc-500/10 text-zinc-400',
}

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-400',
  medium: 'bg-amber-500/10 text-amber-400',
  hard: 'bg-red-500/10 text-red-400',
  expert: 'bg-purple-500/10 text-purple-400',
}

export default function QuestionBankPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectMode = searchParams.get('selectMode') === 'true'
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ questionType: '', difficulty: '', status: selectMode ? 'approved' : '' })
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteId, setDeleteId] = useState(null)
  const queryClient = useQueryClient()
  const { user } = useAppSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      setDeleteId(null)
      notify.success('Question deleted')
    },
  })

  const params = new URLSearchParams({ page, limit: '20', sort: '-createdAt' })
  if (search) params.set('search', search)
  if (filters.questionType) params.set('questionType', filters.questionType)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.status) params.set('status', filters.status)

  const { data, isLoading } = useQuery({
    queryKey: ['questions', params.toString()],
    queryFn: () => api.get(`/questions?${params}`).then((r) => r.data),
  })

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    const questions = data?.data || []
    if (selectedIds.length === questions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(questions.map((q) => q._id))
    }
  }

  const handleAddSelected = () => {
    navigate(`/assessments/create?selected=${selectedIds.join(',')}`)
  }

  return (
    <div className="space-y-6">
      {selectMode && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Selection Mode</p>
              <p className="text-xs text-text-secondary">Select questions to add to your assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">{selectedIds.length} selected</span>
            <Button size="sm" onClick={handleAddSelected} disabled={selectedIds.length === 0}>
              Add to Assessment
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/assessments/create')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">{selectMode ? 'Select Questions' : 'Question Bank'}</h2>
          <p className="mt-1 text-sm text-text-secondary">{selectMode ? 'Pick questions to add to your assessment' : 'Manage your assessment questions'}</p>
        </div>
        {!selectMode && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/question-bank/ai-generate')}>
              <Sparkles className="h-4 w-4" /> AI Generate
            </Button>
            <Button variant="secondary" onClick={() => navigate('/question-bank/import')}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={() => navigate('/question-bank/create')}>
              <Plus className="h-4 w-4" /> New Question
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Search questions..." />
        </div>
        <select value={filters.questionType} onChange={(e) => { setFilters({ ...filters, questionType: e.target.value }); setPage(1) }}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Types</option>
          <option value="single_correct">Single Correct</option>
          <option value="multi_correct">Multi Correct</option>
          <option value="true_false">True/False</option>
          <option value="fill_blanks">Fill Blanks</option>
          <option value="coding">Coding</option>
          <option value="subjective">Subjective</option>
        </select>
        <select value={filters.difficulty} onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1) }}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
        {!selectMode && (
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {isLoading ? <TableSkeleton rows={8} /> : (
        <>
          <div className="rounded-xl border border-border bg-bg-card divide-y divide-border">
            {selectMode && (data?.data?.length > 0) && (
              <div className="px-6 py-3 bg-bg-secondary flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.length === (data?.data?.length || 0) && selectedIds.length > 0} onChange={toggleAll}
                  className="rounded border-border bg-bg-tertiary text-primary focus:ring-primary" />
                <span className="text-xs font-medium text-text-secondary">
                  {selectedIds.length === (data?.data?.length || 0) && selectedIds.length > 0 ? 'Deselect All' : 'Select All'}
                </span>
              </div>
            )}
            {data?.data?.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Questions Found"
                description="Create your first question to get started"
                action={!selectMode ? <Button variant="secondary" onClick={() => navigate('/question-bank/create')}>Create Question</Button> : undefined}
              />
            ) : data?.data?.map((q) => {
              const isSelected = selectedIds.includes(q._id)
              return (
                <div key={q._id}
                  onClick={() => selectMode ? toggleSelect(q._id) : navigate(`/question-bank/${q._id}`)}
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors duration-200 ${
                    selectMode ? `hover:bg-primary/5 ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}` : 'hover:bg-bg-tertiary/50'
                  }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectMode && (
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border bg-bg-tertiary text-primary focus:ring-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[q.questionType]}`}>
                          {q.questionType.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                        {!selectMode && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[q.status]}`}>
                            {q.status.replace('_', ' ')}
                          </span>
                        )}
                        <span className="text-xs text-text-tertiary">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-2 ml-4">
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(q._id) }}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="text-xs text-text-tertiary whitespace-nowrap">
                        v{q.version} &middot; {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {data?.meta?.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {(() => {
                const pages = []
                const total = data.meta.pages
                const current = page
                let start = Math.max(1, current - 2)
                let end = Math.min(total, current + 2)
                if (current <= 3) { end = Math.min(total, 5) }
                if (current >= total - 2) { start = Math.max(1, total - 4) }
                if (start > 1) {
                  pages.push(<button key={1} onClick={() => setPage(1)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-bg-tertiary text-text-secondary hover:bg-bg-elevated">1</button>)
                  if (start > 2) pages.push(<span key="start-ellipsis" className="px-1 text-text-tertiary">...</span>)
                }
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button key={i} onClick={() => setPage(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
                      {i}
                    </button>
                  )
                }
                if (end < total) {
                  if (end < total - 1) pages.push(<span key="end-ellipsis" className="px-1 text-text-tertiary">...</span>)
                  pages.push(<button key={total} onClick={() => setPage(total)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-bg-tertiary text-text-secondary hover:bg-bg-elevated">{total}</button>)
                }
                return pages
              })()}
            </div>
          )}
        </>
      )}

      {selectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-border bg-bg-card shadow-2xl p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">{selectedIds.length} question(s) selected</span>
          <Button size="sm" onClick={handleAddSelected}>
            <CheckCircle className="h-4 w-4" /> Add to Assessment
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/assessments/create')}>
            Done
          </Button>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl border border-border bg-bg-card p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Question</h3>
            <p className="text-sm text-text-secondary mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
