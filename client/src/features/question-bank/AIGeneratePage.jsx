import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { ArrowLeft, Sparkles, Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react'

export default function AIGeneratePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium',
    questionType: 'single_correct',
    provider: 'gemini',
    language: 'English',
  })

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then((r) => r.data),
  })

  const providers = providersData?.data || []

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ai/generate', data),
    onSuccess: (res) => {
      setTimeout(() => navigate('/question-bank'), 2000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/question-bank')} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">AI Generate Questions</h2>
          <p className="mt-1 text-sm text-text-secondary">Generate questions on any topic using AI</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Topic *</label>
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. JavaScript Closures, Calculus, World War II" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Number of Questions</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Question Type</label>
              <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="single_correct">Single Correct</option>
                <option value="multi_correct">Multi Correct</option>
                <option value="true_false">True/False</option>
                <option value="fill_blanks">Fill Blanks</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Language</label>
              <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" />
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

        {mutation.isSuccess && (
          <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-success">Generation Successful</p>
              <p className="text-xs text-text-secondary">{mutation.data?.data?.data?.count || 0} questions created. Redirecting...</p>
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{mutation.error?.response?.data?.message || 'Generation failed'}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/question-bank')}>Cancel</Button>
          <Button type="submit" disabled={!form.topic || mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {mutation.isPending ? 'Generating...' : 'Generate Questions'}
          </Button>
        </div>
      </form>
    </div>
  )
}
