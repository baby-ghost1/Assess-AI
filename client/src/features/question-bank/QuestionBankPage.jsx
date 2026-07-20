import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Plus, Search, Upload, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { TableSkeleton } from '@/components/shared'

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
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ questionType: '', difficulty: '', status: '' })
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page, limit: '20', sort: '-createdAt' })
  if (search) params.set('search', search)
  if (filters.questionType) params.set('questionType', filters.questionType)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.status) params.set('status', filters.status)

  const { data, isLoading } = useQuery({
    queryKey: ['questions', params.toString()],
    queryFn: () => api.get(`/questions?${params}`).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Question Bank</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage your assessment questions</p>
        </div>
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

        <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? <TableSkeleton rows={8} /> : (
        <>
          <div className="rounded-xl border border-border bg-bg-card divide-y divide-border">
            {data?.data?.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <BookOpen className="h-12 w-12 text-text-tertiary mb-4" />
                <p className="text-text-secondary text-sm">No questions found</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/question-bank/create')}>Create your first question</Button>
              </div>
            ) : data?.data?.map((q) => (
              <div key={q._id} onClick={() => navigate(`/question-bank/${q._id}`)}
                className="flex items-center justify-between px-6 py-4 hover:bg-bg-tertiary/50 cursor-pointer transition-colors duration-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[q.questionType]}`}>
                      {q.questionType.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[q.status]}`}>
                      {q.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-text-tertiary">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-xs text-text-tertiary whitespace-nowrap ml-4">
                  v{q.version} &middot; {new Date(q.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {data?.meta?.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: data.meta.pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
