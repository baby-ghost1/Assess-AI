import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react'

export default function AssessmentCreatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '', description: '', assessmentType: 'quiz', difficulty: 'medium',
    timeLimit: '', passingPercentage: 40, maxAttempts: 1,
    shuffleQuestions: false, shuffleOptions: false,
    showResultImmediately: true, showCorrectAnswers: true,
    negativeMarking: false, negativeMarkingValue: 0,
    partialMarking: false, proctoringRequired: false,
    sections: [{ title: 'Section 1', description: '', questions: [] }],
  })

  const { data: editData } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const { data: questionsData } = useQuery({
    queryKey: ['questions-all'],
    queryFn: () => api.get('/questions?status=approved&limit=200').then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/assessments/${id}`, data) : api.post('/assessments', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assessments'] }); navigate('/assessments') },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      timeLimit: form.timeLimit ? Number(form.timeLimit) * 60 : null,
      sections: form.sections.map((s) => ({
        ...s,
        totalMarks: s.questions.length,
      })),
    }
    mutation.mutate(data)
  }

  const addSection = () => {
    setForm({ ...form, sections: [...form.sections, { title: `Section ${form.sections.length + 1}`, description: '', questions: [] }] })
  }

  const removeSection = (i) => {
    if (form.sections.length > 1) {
      setForm({ ...form, sections: form.sections.filter((_, idx) => idx !== i) })
    }
  }

  const toggleQuestion = (sectionIdx, qId) => {
    const sections = [...form.sections]
    const qs = sections[sectionIdx].questions
    if (qs.includes(qId)) {
      sections[sectionIdx] = { ...sections[sectionIdx], questions: qs.filter((id) => id !== qId) }
    } else {
      sections[sectionIdx] = { ...sections[sectionIdx], questions: [...qs, qId] }
    }
    setForm({ ...form, sections })
  }

  const questions = questionsData?.data || []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assessments')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">{isEdit ? 'Edit Assessment' : 'Create Assessment'}</h2>
          <p className="mt-1 text-sm text-text-secondary">Configure assessment settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. JavaScript Fundamentals" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
              <select value={form.assessmentType} onChange={(e) => setForm({ ...form, assessmentType: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="quiz">Quiz</option>
                <option value="coding">Coding</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Time (minutes)</label>
              <input type="number" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="No limit" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Pass %</label>
              <input type="number" min="0" max="100" value={form.passingPercentage} onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ['shuffleQuestions', 'Shuffle Questions'],
              ['shuffleOptions', 'Shuffle Options'],
              ['showResultImmediately', 'Show Result Immediately'],
              ['showCorrectAnswers', 'Show Correct Answers'],
              ['negativeMarking', 'Negative Marking'],
              ['partialMarking', 'Partial Marking'],
              ['proctoringRequired', 'Proctoring Required'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-border bg-bg-tertiary text-primary focus:ring-primary" />
                {label}
              </label>
            ))}
          </div>

          {form.negativeMarking && (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Negative Marking Value</label>
              <input type="number" min="0" step="0.25" value={form.negativeMarkingValue} onChange={(e) => setForm({ ...form, negativeMarkingValue: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Sections</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4" /> Add Section
            </Button>
          </div>

          {form.sections.map((section, si) => (
            <div key={si} className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <input value={section.title} onChange={(e) => {
                    const sections = [...form.sections]; sections[si] = { ...sections[si], title: e.target.value }; setForm({ ...form, sections })
                  }} className="flex-1 rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  <span className="text-xs text-text-tertiary">{section.questions.length} questions</span>
                </div>
                {form.sections.length > 1 && (
                  <button type="button" onClick={() => removeSection(si)} className="p-1.5 text-text-tertiary hover:text-danger transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {questions.filter((q) => q.status === 'approved').map((q) => (
                  <label key={q._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${section.questions.includes(q._id) ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}>
                    <input type="checkbox" checked={section.questions.includes(q._id)} onChange={() => toggleQuestion(si, q._id)}
                      className="rounded border-border bg-bg-tertiary text-primary focus:ring-primary" />
                    <span className="flex-1 truncate">{q.title}</span>
                    <span className="text-xs text-text-tertiary">{q.questionType.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              {questions.filter((q) => q.status === 'approved').length === 0 && (
                <p className="text-xs text-text-tertiary text-center py-4">No approved questions available. Add questions to the Question Bank first.</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/assessments')}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="h-4 w-4" /> {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
