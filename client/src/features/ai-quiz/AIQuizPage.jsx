import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import {
  Sparkles, Loader2, Brain, Zap, AlertCircle, CheckCircle,
  History, RotateCcw, Trophy, Target, BookOpen, Hash,
  Timer, BarChart3, Search
} from 'lucide-react'

const QUESTION_TYPE_OPTIONS = [
  { value: 'single_correct', label: 'Single Correct', icon: CheckCircle },
  { value: 'multi_correct', label: 'Multi Correct', icon: CheckCircle },
  { value: 'true_false', label: 'True / False', icon: CheckCircle },
  { value: 'fill_blanks', label: 'Fill Blanks', icon: CheckCircle },
]

const TOPIC_SUGGESTIONS = [
  { label: 'JavaScript', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { label: 'Python', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { label: 'Data Structures', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { label: 'React', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { label: 'Node.js', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { label: 'SQL', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { label: 'Operating Systems', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { label: 'Computer Networks', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { label: 'DBMS', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { label: 'OOPs', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  { label: 'Machine Learning', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  { label: 'General Knowledge', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { value: 'expert', label: 'Expert', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
]

function HistoryCard({ item, onRetake }) {
  const [showInsights, setShowInsights] = useState(false)
  const passed = item.passed
  return (
    <div className="group rounded-xl border border-border bg-bg-card p-4 hover:border-primary/20 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary truncate">{item.topic}</h4>
          <p className="text-xs text-text-tertiary mt-0.5">{item.provider} · {item.totalQuestions}Q</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
          passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {item.percentage != null ? `${Math.round(item.percentage)}%` : '--'}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
          item.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-500' :
          item.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-500' :
          item.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
          'bg-purple-500/10 text-purple-500'
        }`}>{item.difficulty}</span>
        <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{item.timeSpent ? `${Math.round(item.timeSpent / 60)}m` : '--'}</span>
        <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{item.score}/{item.totalMarks}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onRetake(item)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <RotateCcw className="h-3 w-3" /> Retake
        </button>
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
        >
          <BarChart3 className="h-3 w-3" /> Insights
        </button>
      </div>
    </div>
  )
}

export default function AIQuizPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium',
    questionTypes: ['single_correct'],
    provider: 'groq',
    timerType: 'overall',
    timeLimit: 10,
    language: 'English',
  })

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then((r) => r.data),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-quiz-history'],
    queryFn: () => api.get('/ai/quiz/history').then((r) => r.data),
  })

  const providers = providersData?.data || []
  const history = historyData?.data || []

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

  const handleRetake = (item) => {
    setForm({
      topic: item.topic || '',
      count: item.totalQuestions || 5,
      difficulty: item.difficulty || 'medium',
      questionTypes: ['single_correct'],
      provider: item.provider || 'groq',
      timerType: item.timerType || 'overall',
      timeLimit: 10,
      language: 'English',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT: FORM ────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">AI Quiz</h2>
              <p className="mt-1 text-sm text-text-secondary">Generate and start an instant AI-powered quiz</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Topic Card */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" /> Topic
                </label>
                <span className="text-[10px] text-text-tertiary font-medium">Required</span>
              </div>

              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. JavaScript Closures, World War II, Organic Chemistry"
                required
              />

              {/* Topic Suggestions */}
              <div>
                <p className="text-[11px] text-text-tertiary mb-2 font-medium">Popular Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_SUGGESTIONS.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setForm({ ...form, topic: t.label })}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all hover:scale-105 ${
                        form.topic === t.label
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                          : t.color
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-5">
              <h3 className="text-sm font-semibold text-text-primary">Quiz Settings</h3>

              {/* Questions + Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Questions</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <input type="number" min="1" max="20" value={form.count}
                      onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Difficulty</label>
                  <div className="flex gap-1.5">
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <button key={d.value} type="button"
                        onClick={() => setForm({ ...form, difficulty: d.value })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          form.difficulty === d.value
                            ? d.color + ' ring-1 ring-current/30'
                            : 'border-border bg-bg-secondary text-text-tertiary hover:text-text-secondary'
                        }`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Question Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPE_OPTIONS.map((qt) => {
                    const selected = form.questionTypes.includes(qt.value)
                    return (
                      <button type="button" key={qt.value} onClick={() => toggleQuestionType(qt.value)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                          selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary'
                        }`}>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                          selected ? 'bg-primary border-primary' : 'border-text-tertiary'
                        }`}>
                          {selected && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        {qt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Timer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Timer Type</label>
                  <select value={form.timerType} onChange={(e) => setForm({ ...form, timerType: e.target.value })}
                    className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="overall">Overall Quiz Timer</option>
                    <option value="per_question">Per Question Timer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {form.timerType === 'overall' ? 'Time Limit (min)' : 'Time / Question (sec)'}
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <input type="number" min="1" value={form.timeLimit}
                      onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Model */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI Model
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia'].map((p) => {
                  const prov = providers.find((x) => x.name === p)
                  const configured = prov?.configured
                  const isSelected = form.provider === p
                  return (
                    <button type="button" key={p} onClick={() => setForm({ ...form, provider: p })}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10'
                          : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary hover:bg-bg-tertiary'
                      } ${!configured ? 'opacity-40' : ''}`}
                      title={!configured ? `${p} API key not configured` : p}>
                      <Brain className="h-5 w-5" />
                      <span className="capitalize font-medium">{p}</span>
                      {!configured && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-bg-card" />
                      )}
                      {isSelected && <div className="absolute inset-0 rounded-xl ring-2 ring-primary/30" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0" />
                <p className="text-sm text-danger">{mutation.error?.response?.data?.message || 'Failed to generate quiz'}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button type="submit" disabled={!form.topic || mutation.isPending} size="lg" className="min-w-[180px]">
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Generate & Start</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: HISTORY SIDEBAR ──────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Quiz History
                </h3>
                <span className="text-[10px] text-text-tertiary font-medium">{history.length} quizzes</span>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary mb-3">
                    <BookOpen className="h-6 w-6 text-text-tertiary" />
                  </div>
                  <p className="text-sm text-text-tertiary">No quizzes taken yet</p>
                  <p className="text-xs text-text-tertiary mt-1">Create your first quiz to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {history.map((item) => (
                    <HistoryCard key={item.attemptId} item={item} onRetake={handleRetake} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {history.length > 0 && (
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <h3 className="text-sm font-heading font-semibold text-text-primary flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-amber-500" /> Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Quizzes', value: history.length, icon: Target, color: 'text-primary' },
                    { label: 'Avg Score', value: `${Math.round(history.reduce((s, h) => s + (h.percentage || 0), 0) / history.length)}%`, icon: BarChart3, color: 'text-emerald-500' },
                    { label: 'Passed', value: history.filter((h) => h.passed).length, icon: CheckCircle, color: 'text-emerald-500' },
                    { label: 'Best Score', value: `${Math.max(...history.map((h) => h.percentage || 0))}%`, icon: Trophy, color: 'text-amber-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-bg-secondary p-3 text-center">
                      <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                      <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                      <p className="text-[10px] text-text-tertiary">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
