import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Sparkles, Loader2, Brain, Zap, Clock, AlertCircle, CheckCircle } from 'lucide-react'

const QUESTION_TYPE_OPTIONS = [
  { value: 'single_correct', label: 'Single Correct' },
  { value: 'multi_correct', label: 'Multi Correct' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blanks', label: 'Fill Blanks' },
]

export default function AIQuizPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium',
    questionTypes: ['single_correct'],
    provider: 'gemini',
    timerType: 'overall',
    timeLimit: 10,
    language: 'English',
  })

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then((r) => r.data),
  })

  const providers = providersData?.data || []

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ai/quiz/generate-and-start', data),
    onSuccess: (res) => {
      navigate(`/assessments/${res.data.data.attemptId}`)
    },
  })

  const toggleQuestionType = (val) => {
    setForm((prev) => {
      const has = prev.questionTypes.includes(val)
      if (has && prev.questionTypes.length <= 1) return prev
      return {
        ...prev,
        questionTypes: has
          ? prev.questionTypes.filter((t) => t !== val)
          : [...prev.questionTypes, val],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...form,
      timeLimit: form.timeLimit * 60,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-accent/10 p-3"><Zap className="h-6 w-6 text-accent" /></div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">AI Quiz</h2>
          <p className="mt-1 text-sm text-text-secondary">Generate and start an instant AI-powered quiz</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Topic *</label>
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. JavaScript Closures, World War II, Organic Chemistry" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Questions</label>
              <input type="number" min="1" max="20" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
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
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Question Types</label>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TYPE_OPTIONS.map((qt) => {
                const selected = form.questionTypes.includes(qt.value)
                return (
                  <button type="button" key={qt.value} onClick={() => toggleQuestionType(qt.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      selected ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary'
                    }`}>
                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selected ? 'bg-accent border-accent' : 'border-text-tertiary'
                    }`}>
                      {selected && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    {qt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Timer Type</label>
              <select value={form.timerType} onChange={(e) => setForm({ ...form, timerType: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="overall">Overall Quiz Timer</option>
                <option value="per_question">Per Question Timer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {form.timerType === 'overall' ? 'Time Limit (minutes)' : 'Time per Question (seconds)'}
              </label>
              <input type="number" min="1" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">AI Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia'].map((p) => {
                const prov = providers.find((x) => x.name === p)
                const configured = prov?.configured
                return (
                  <button type="button" key={p} onClick={() => setForm({ ...form, provider: p })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      form.provider === p
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary'
                    } ${!configured ? 'opacity-50' : ''}`}
                    title={!configured ? `${p} API key not configured` : p}
                  >
                    <Brain className="h-4 w-4" />
                    <span className="capitalize">{p}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {mutation.isError && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{mutation.error?.response?.data?.message || 'Failed to generate quiz'}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Cancel</Button>
          <Button type="submit" disabled={!form.topic || mutation.isPending} size="lg">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {mutation.isPending ? 'Generating...' : 'Generate & Start Quiz'}
          </Button>
        </div>
      </form>
    </div>
  )
}
