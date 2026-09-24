import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Sparkles, Loader2, AlertCircle,
  RotateCcw, BookOpen, Hash,
  Timer, BarChart3, ChevronDown, Check, X, Zap
} from 'lucide-react'

const QUESTION_TYPES = [
  { value: 'single_correct', label: 'Single Correct' },
  { value: 'multi_correct', label: 'Multi Correct' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blanks', label: 'Fill Blanks' },
]

const SUGGESTIONS = [
  { label: 'JavaScript', accent: '#f7df1e' },
  { label: 'Python', accent: '#3776ab' },
  { label: 'Data Structures', accent: '#10b981' },
  { label: 'React', accent: '#61dafb' },
  { label: 'Node.js', accent: '#339933' },
  { label: 'SQL', accent: '#8b5cf6' },
  { label: 'OS', accent: '#f97316' },
  { label: 'Networks', accent: '#ec4899' },
  { label: 'DBMS', accent: '#6366f1' },
  { label: 'OOPs', accent: '#ef4444' },
  { label: 'ML', accent: '#a855f7' },
  { label: 'General Knowledge', accent: '#14b8a6' },
]

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', glow: '#10b981' },
  { value: 'medium', label: 'Medium', glow: '#f59e0b' },
  { value: 'hard', label: 'Hard', glow: '#ef4444' },
  { value: 'expert', label: 'Expert', glow: '#a855f7' },
]

function ProviderDropdown({ providers, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const ALL = ['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia', 'bazaarlink']
  const sorted = [...ALL].sort((a, b) => {
    const aC = providers.find((x) => x.name === a)?.configured ? 0 : 1
    const bC = providers.find((x) => x.name === b)?.configured ? 0 : 1
    return aC - bC
  })
  const sel = providers.find((x) => x.name === selected)

  return (
      <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-primary hover:bg-bg-elevated hover:border-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <span className="capitalize font-medium block leading-tight">{selected}</span>
            <span className={`text-[10px] font-medium ${sel?.configured ? 'text-success' : 'text-danger'}`}>
              {sel?.configured ? 'Configured' : 'API key missing'}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-bg-card backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
            {sorted.map((p, i) => {
              const prov = providers.find((x) => x.name === p)
              const active = selected === p
              return (
                <button type="button" key={p} onClick={() => { onSelect(p); setOpen(false) }}
                  style={{ animationDelay: `${i * 20}ms` }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 animate-[fadeIn_0.15s_ease-out_both] ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/10'
                      : 'text-text-secondary hover:bg-bg-elevated border border-transparent'
                  }`}>
                  <span className="capitalize flex-1 text-left font-medium">{p}</span>
                  {prov?.configured
                    ? <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center"><Check className="h-3 w-3 text-success" /></div>
                    : <div className="h-5 w-5 rounded-full bg-bg-tertiary flex items-center justify-center"><X className="h-3 w-3 text-text-tertiary" /></div>
                  }
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TimerDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const OPTIONS = [
    { value: 'overall', label: 'Overall Quiz', desc: 'Single timer for entire quiz' },
    { value: 'per_question', label: 'Per Question', desc: 'Individual timer per question' },
  ]
  const selected = OPTIONS.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm text-text-primary hover:bg-bg-elevated hover:border-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Timer className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <span className="font-medium block leading-tight">{selected?.label}</span>
            <span className="text-[10px] text-text-tertiary">{selected?.desc}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-bg-card backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-1.5">
            {OPTIONS.map((opt, i) => {
              const active = value === opt.value
              return (
                <button type="button" key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
                  style={{ animationDelay: `${i * 20}ms` }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 animate-[fadeIn_0.15s_ease-out_both] ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/10'
                      : 'text-text-secondary hover:bg-bg-elevated border border-transparent'
                  }`}>
                  <div className="flex-1 text-left">
                    <span className="font-medium block leading-tight">{opt.label}</span>
                    <span className={`text-[10px] ${active ? 'text-primary' : 'text-text-tertiary'}`}>{opt.desc}</span>
                  </div>
                  {active && <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center"><Check className="h-3 w-3 text-primary" /></div>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const HistoryCard = React.memo(function HistoryCard({ item, onRetake }) {
  const [open, setOpen] = useState(false)
  const passed = item.passed
  const pct = item.percentage != null ? Math.round(item.percentage) : null

  return (
    <div className="group relative rounded-xl border border-border bg-bg-card p-4 hover:bg-bg-elevated hover:border-text-tertiary transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-primary truncate pr-3 group-hover:text-white transition-colors">{item.topic}</h4>
        {pct !== null && (
          <div className="relative">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-bg-tertiary" />
              <circle cx="18" cy="18" r="15" fill="none" strokeWidth="2"
                stroke={passed ? '#10b981' : '#ef4444'}
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                strokeLinecap="round"
                className="transition-all duration-700" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-text-primary">{pct}%</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary mb-3 font-medium uppercase tracking-wider">
        <span>{item.difficulty}</span>
        <span className="text-text-tertiary/30">&bull;</span>
        <span>{item.totalQuestions}Q</span>
        <span className="text-text-tertiary/30">&bull;</span>
        <span>{item.provider}</span>
        {item.timeSpent > 0 && <><span className="text-text-tertiary/30">&bull;</span><span>{Math.round(item.timeSpent / 60)}m</span></>}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onRetake(item)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-border hover:border-text-tertiary transition-all duration-200">
          <RotateCcw className="h-3 w-3" /> Retake
        </button>
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary transition-all duration-200">
          <BarChart3 className="h-3 w-3" /> {open ? 'Less' : 'More'}
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-text-secondary space-y-1.5 animate-[slideDown_0.2s_ease-out]">
          <div className="flex justify-between"><span className="text-text-tertiary">Score</span><span className="font-medium text-text-primary">{item.score}/{item.totalMarks}</span></div>
          <div className="flex justify-between"><span className="text-text-tertiary">Status</span><span className={`font-medium ${passed ? 'text-success' : 'text-danger'}`}>{passed ? 'Passed' : 'Failed'}</span></div>
        </div>
      )}
    </div>
  )
})

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
    onSuccess: (res) => navigate(`/assessments/${res.data.data.attemptId}`),
  })

  const toggleType = (val) => {
    setForm((prev) => {
      const has = prev.questionTypes.includes(val)
      if (has && prev.questionTypes.length <= 1) return prev
      return { ...prev, questionTypes: has ? prev.questionTypes.filter((t) => t !== val) : [...prev.questionTypes, val] }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Minutes for overall timer; seconds-per-question for per_question mode.
    const timeLimit = form.timerType === 'overall' ? form.timeLimit * 60 : form.timeLimit
    mutation.mutate({ ...form, timeLimit })
  }

  const handleRetake = (item) => {
    setForm({ topic: item.topic || '', count: item.totalQuestions || 5, difficulty: item.difficulty || 'medium', questionTypes: ['single_correct'], provider: item.provider || 'groq', timerType: item.timerType || 'overall', timeLimit: 10, language: 'English' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-bg-card p-8 md:p-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-500/5 blur-[60px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-primary/40" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">AI Quiz</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md leading-relaxed">
            Pick a topic, choose your settings, and let AI craft the perfect quiz for you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* FORM */}
        <div className="lg:col-span-3 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Topic */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-4">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Topic</label>
              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-tertiary py-3.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="What do you want to be quizzed on?"
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button key={s.label} type="button" onClick={() => setForm({ ...form, topic: s.label })}
                    style={{ '--accent': s.accent, animationDelay: `${i * 30}ms` }}
                    className={`group/chip relative px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 animate-[fadeIn_0.2s_ease-out_both] ${
                      form.topic === s.label
                        ? 'border-primary/30 bg-primary/10 text-text-primary'
                        : 'border-border bg-bg-tertiary text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
                    }`}>
                    <span className="relative z-10">{s.label}</span>
                    {form.topic === s.label && (
                      <div className="absolute inset-0 rounded-lg opacity-20" style={{ background: `linear-gradient(135deg, ${s.accent}40, transparent)` }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Settings</label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Questions</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                    <input type="number" min="1" max="20" value={form.count}
                      onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-bg-tertiary py-3 pl-10 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">
                    {form.timerType === 'overall' ? 'Time (min)' : 'Sec / Question'}
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                    <input type="number" min="1" value={form.timeLimit}
                      onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-bg-tertiary py-3 pl-10 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300" />
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Difficulty</label>
                <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary border border-border">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.value} type="button" onClick={() => setForm({ ...form, difficulty: d.value })}
                      className={`relative flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all duration-300 ${
                        form.difficulty === d.value
                          ? 'text-text-primary'
                          : 'text-text-tertiary hover:text-text-secondary'
                      }`}>
                      {form.difficulty === d.value && (
                        <div className="absolute inset-0 rounded-lg bg-bg-elevated border border-text-tertiary shadow-sm" />
                      )}
                      <span className="relative z-10">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer + AI Model */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">Timer Mode</label>
                  <TimerDropdown value={form.timerType} onChange={(v) => setForm({ ...form, timerType: v })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">AI Model</label>
                  <ProviderDropdown providers={providers} selected={form.provider} onSelect={(p) => setForm({ ...form, provider: p })} />
                </div>
              </div>
            </div>

            {/* Question Types */}
            <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Question Types</label>
              <div className="grid grid-cols-2 gap-2">
                {QUESTION_TYPES.map((qt, i) => {
                  const active = form.questionTypes.includes(qt.value)
                  return (
                    <button type="button" key={qt.value} onClick={() => toggleType(qt.value)}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 animate-[fadeIn_0.2s_ease-out_both] ${
                        active
                          ? 'border-primary/30 bg-primary/10 text-text-primary shadow-sm'
                          : 'border-border bg-bg-tertiary text-text-tertiary hover:border-text-tertiary hover:bg-bg-elevated hover:text-text-secondary'
                      }`}>
                      <div className={`w-4 h-4 rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200 ${
                        active ? 'bg-primary border-primary scale-110' : 'border-text-tertiary/30'
                      }`}>
                        {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>
                      {qt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
                <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                <p className="text-sm text-danger">{mutation.error?.response?.data?.message || 'Failed to generate quiz'}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" disabled={!form.topic || mutation.isPending}
                className="group relative w-full h-14 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/90 to-primary text-white hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2.5">
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating your quiz...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate &amp; Start Quiz</>
                  )}
                </span>
              </button>
              <p className="text-center text-[11px] text-text-tertiary mt-3">AI will generate questions based on your selected topic and settings</p>
            </div>
          </form>
        </div>

        {/* HISTORY SIDEBAR */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Recent Quizzes</h2>
              {history.length > 0 && (
                <span className="text-[10px] text-text-tertiary font-mono">{history.length}</span>
              )}
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-bg-card">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary mb-4">
                  <BookOpen className="h-6 w-6 text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">No quizzes yet</p>
                <p className="text-[11px] text-text-tertiary mt-1.5">Complete your first quiz to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar pr-1">
                {history.map((item) => (
                  <HistoryCard key={item.attemptId} item={item} onRetake={handleRetake} />
                ))}
              </div>
            )}

            {/* Stats */}
            {history.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Quizzes', value: history.length },
                    { label: 'Avg Score', value: `${Math.round(history.reduce((s, h) => s + (h.percentage || 0), 0) / history.length)}%` },
                    { label: 'Pass Rate', value: `${Math.round((history.filter((h) => h.passed).length / history.length) * 100)}%` },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-bold text-text-primary tabular-nums tracking-tight">{s.value}</p>
                      <p className="text-[9px] text-text-tertiary uppercase tracking-widest mt-1 font-medium">{s.label}</p>
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
