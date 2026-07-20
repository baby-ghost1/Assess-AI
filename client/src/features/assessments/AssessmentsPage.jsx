import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Plus, Brain, Code2, Play, Clock, BarChart3 } from 'lucide-react'
import { TableSkeleton } from '@/components/shared'
import { useAppSelector } from '@/hooks'

export default function AssessmentsPage() {
  const navigate = useNavigate()
  const { user } = useAppSelector((s) => s.auth)
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', filter],
    queryFn: () => api.get(`/assessments?status=published${filter ? `&assessmentType=${filter}` : ''}`).then((r) => r.data),
  })

  const assessments = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Assessments</h2>
          <p className="mt-1 text-sm text-text-secondary">Browse and attempt assessments</p>
        </div>
        {['problem_setter', 'admin', 'super_admin'].includes(user?.role) && (
          <Button onClick={() => navigate('/assessments/create')}>
            <Plus className="h-4 w-4" /> New Assessment
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {['', 'quiz', 'coding', 'mixed'].map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === t ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'}`}>
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={4} /> : assessments.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card py-16 text-center">
          <Brain className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary text-sm">No assessments available</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => (
            <div key={a._id} className="rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-all duration-200 group">
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
                <Play className="h-4 w-4" /> Start Assessment
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
