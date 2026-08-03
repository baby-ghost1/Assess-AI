import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Save, Plus, Trash2, AlertCircle, X, Send, Sparkles, Upload, FileText,
  Loader2, Brain, CheckCircle, MessageSquare, GripVertical, Settings2, Layers,
  FileUp, Wand2, ChevronDown, Pen, Info, BookOpen,
} from 'lucide-react'

const ACCEPTED_TYPES = '.csv,.json,.xlsx,.xls,.pdf,.docx,.txt'

const questionTypeOptions = [
  { value: 'single_correct', label: 'Single Correct', icon: '◉' },
  { value: 'multi_correct', label: 'Multi Correct', icon: '◎' },
  { value: 'true_false', label: 'True / False', icon: '⊘' },
  { value: 'fill_blanks', label: 'Fill Blanks', icon: '▭' },
  { value: 'coding', label: 'Coding', icon: '⟨⟩' },
  { value: 'subjective', label: 'Subjective', icon: '✎' },
]

const difficultyConfig = {
  easy: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Easy' },
  medium: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Medium' },
  hard: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Hard' },
  expert: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Expert' },
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-bg-tertiary'
      )}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-6' : 'translate-x-1')} />
      {label && <span className="ml-2 text-sm text-text-secondary select-none">{label}</span>}
    </button>
  )
}

function InlineQuestionForm({ onAdd, disabled }) {
  const [q, setQ] = useState({
    title: '', description: '', questionType: 'single_correct', difficulty: 'medium', marks: 1,
    options: [
      { text: '', key: 'A', isCorrect: false },
      { text: '', key: 'B', isCorrect: false },
      { text: '', key: 'C', isCorrect: false },
      { text: '', key: 'D', isCorrect: false },
    ],
    correctAnswer: '',
    codingConfig: { language: 'javascript', starterCode: '', testCases: [{ input: '', output: '', isHidden: false }] },
  })

  const [expanded, setExpanded] = useState(false)
  const isMCQ = ['single_correct', 'multi_correct'].includes(q.questionType)
  const isTF = q.questionType === 'true_false'
  const isCoding = q.questionType === 'coding'
  const isFill = q.questionType === 'fill_blanks'

  const toggleCorrect = (key) => {
    if (q.questionType === 'single_correct') {
      setQ({ ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.key === key })), correctAnswer: key })
    } else {
      const opts = q.options.map((o) => o.key === key ? { ...o, isCorrect: !o.isCorrect } : o)
      const correct = opts.filter((o) => o.isCorrect).map((o) => o.key)
      setQ({ ...q, options: opts, correctAnswer: correct })
    }
  }

  const addOption = () => {
    const key = String.fromCharCode(65 + q.options.length)
    setQ({ ...q, options: [...q.options, { text: '', key, isCorrect: false }] })
  }

  const removeOption = (idx) => {
    if (q.options.length > 2) {
      setQ({ ...q, options: q.options.filter((_, i) => i !== idx) })
    }
  }

  const canAdd = q.title.trim() && (
    isTF || isFill || isCoding || q.questionType === 'subjective' || (isMCQ && q.options.filter((o) => o.text.trim()).length >= 2 && q.options.some((o) => o.isCorrect))
  )

  const handleAdd = () => {
    if (!canAdd) return
    const question = { ...q }
    if (isTF) {
      question.options = [{ text: 'True', key: 'A', isCorrect: q.correctAnswer === 'A' }, { text: 'False', key: 'B', isCorrect: q.correctAnswer === 'B' }]
    }
    if (isFill || q.questionType === 'subjective') {
      question.options = []
    }
    onAdd(question)
    setQ({
      title: '', description: '', questionType: q.questionType, difficulty: q.difficulty, marks: 1,
      options: [{ text: '', key: 'A', isCorrect: false }, { text: '', key: 'B', isCorrect: false }, { text: '', key: 'C', isCorrect: false }, { text: '', key: 'D', isCorrect: false }],
      correctAnswer: '',
      codingConfig: { language: 'javascript', starterCode: '', testCases: [{ input: '', output: '', isHidden: false }] },
    })
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} disabled={disabled}
        className="w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/10 group disabled:opacity-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">Write a Question</p>
          <p className="text-xs text-text-tertiary">Click to expand the question form</p>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">New Question</span>
        </div>
        <button type="button" onClick={() => setExpanded(false)} className="text-text-tertiary hover:text-text-secondary p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Type</label>
          <select value={q.questionType} onChange={(e) => setQ({ ...q, questionType: e.target.value })} disabled={disabled}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors">
            {questionTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Difficulty</label>
          <select value={q.difficulty} onChange={(e) => setQ({ ...q, difficulty: e.target.value })} disabled={disabled}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors">
            {Object.entries(difficultyConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Marks</label>
          <input type="number" min="1" value={q.marks} onChange={(e) => setQ({ ...q, marks: Number(e.target.value) })} disabled={disabled}
            className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors" />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Question *</label>
        <input value={q.title} onChange={(e) => setQ({ ...q, title: e.target.value })} disabled={disabled}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
          placeholder="Enter your question here..." />
      </div>

      <div>
        <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Description <span className="normal-case">(optional)</span></label>
        <textarea value={q.description} onChange={(e) => setQ({ ...q, description: e.target.value })} rows={2} disabled={disabled}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50 transition-colors"
          placeholder="Add context or code snippets..." />
      </div>

      {isMCQ && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Options</label>
            <span className="text-[10px] text-text-tertiary">Click letter to mark correct</span>
          </div>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 group/opt">
              <button type="button" onClick={() => toggleCorrect(opt.key)} disabled={disabled}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 shrink-0',
                  opt.isCorrect
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                )}>
                {opt.key}
              </button>
              <input value={opt.text} onChange={(e) => {
                const opts = [...q.options]; opts[i] = { ...opts[i], text: e.target.value }; setQ({ ...q, options: opts })
              }} disabled={disabled}
                className="flex-1 rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
                placeholder={`Option ${opt.key}`} />
              {q.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} disabled={disabled}
                  className="opacity-0 group-hover/opt:opacity-100 text-text-tertiary hover:text-danger transition-all p-1 disabled:opacity-50">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <button type="button" onClick={addOption} disabled={disabled}
              className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary font-medium disabled:opacity-50 transition-colors mt-1">
              <Plus className="h-3 w-3" /> Add option
            </button>
          )}
        </div>
      )}

      {isTF && (
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Correct Answer</label>
          <div className="flex gap-3">
            {['A', 'B'].map((key) => (
              <button type="button" key={key} onClick={() => setQ({ ...q, correctAnswer: key })} disabled={disabled}
                className={cn(
                  'flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200',
                  q.correctAnswer === key
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'border-border bg-bg-secondary text-text-secondary hover:border-border-light'
                )}>
                {key === 'A' ? 'True' : 'False'}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFill && (
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Correct Answer *</label>
          <input value={q.correctAnswer} onChange={(e) => setQ({ ...q, correctAnswer: e.target.value })} disabled={disabled}
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
            placeholder="Enter the correct answer" />
        </div>
      )}

      {isCoding && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Language</label>
            <select value={q.codingConfig?.language || 'javascript'} onChange={(e) => setQ({ ...q, codingConfig: { ...q.codingConfig, language: e.target.value } })} disabled={disabled}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Starter Code</label>
            <textarea value={q.codingConfig?.starterCode || ''} onChange={(e) => setQ({ ...q, codingConfig: { ...q.codingConfig, starterCode: e.target.value } })} rows={3} disabled={disabled}
              className="w-full rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50 transition-colors"
              placeholder="// Write starter code here..." />
          </div>
        </div>
      )}

      {q.questionType === 'subjective' && (
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Model Answer / Rubric</label>
          <textarea value={q.correctAnswer} onChange={(e) => setQ({ ...q, correctAnswer: e.target.value })} rows={3} disabled={disabled}
            className="w-full rounded-lg border border-border bg-bg-secondary py-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50 transition-colors"
            placeholder="Describe the expected answer or grading criteria..." />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', difficultyConfig[q.difficulty].color)}>
            {difficultyConfig[q.difficulty].label}
          </span>
          <span className="text-[10px] text-text-tertiary">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
        </div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!canAdd || disabled}>
          <Plus className="h-3.5 w-3.5" /> Add Question
        </Button>
      </div>
    </div>
  )
}

function ManualForm({ form, setForm, isEdit: _isEdit, editStatus }) {
  const navigate = useNavigate()
  const { data: questionsData } = useQuery({
    queryKey: ['questions-all'],
    queryFn: () => api.get('/questions?status=approved&limit=200').then((r) => r.data),
  })
  const questions = questionsData?.data || []
  const [sourceTab, setSourceTab] = useState('write')
  const [expandedSections, setExpandedSections] = useState({ 0: true })

  const addSection = () => {
    const newIdx = form.sections.length
    setForm({ ...form, sections: [...form.sections, { title: `Section ${newIdx + 1}`, description: '', questions: [], inlineQuestions: [] }] })
    setExpandedSections((prev) => ({ ...prev, [newIdx]: true }))
  }

  const removeSection = (i) => {
    if (form.sections.length > 1) {
      setForm({ ...form, sections: form.sections.filter((_, idx) => idx !== i) })
    }
  }

  const toggleSection = (i) => {
    setExpandedSections((prev) => ({ ...prev, [i]: !prev[i] }))
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

  const addInlineQuestion = (sectionIdx, question) => {
    const sections = [...form.sections]
    const iq = sections[sectionIdx].inlineQuestions || []
    sections[sectionIdx] = { ...sections[sectionIdx], inlineQuestions: [...iq, question] }
    setForm({ ...form, sections })
  }

  const removeInlineQuestion = (sectionIdx, qIdx) => {
    const sections = [...form.sections]
    sections[sectionIdx] = { ...sections[sectionIdx], inlineQuestions: sections[sectionIdx].inlineQuestions.filter((_, i) => i !== qIdx) }
    setForm({ ...form, sections })
  }

  const disabled = editStatus === 'pending_approval'
  const totalQuestions = form.sections.reduce((acc, s) => acc + (s.questions?.length || 0) + (s.inlineQuestions?.length || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-1 bg-bg-secondary rounded-xl w-fit">
        <button type="button" onClick={() => setSourceTab('write')} disabled={disabled}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            sourceTab === 'write' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary',
            disabled && 'opacity-50'
          )}>
          <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Write Questions</span>
        </button>
        <button type="button" onClick={() => navigate('/question-bank?selectMode=true')} disabled={disabled}
          className={cn(
            'px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            'text-text-secondary hover:text-primary',
            disabled && 'opacity-50'
          )}>
          <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> Pick from Bank</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-text-primary">Sections</h3>
          <span className="text-xs text-text-tertiary bg-bg-secondary px-2.5 py-1 rounded-full">{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</span>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addSection} disabled={disabled}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {form.sections.map((section, si) => {
          const sectionQCount = (section.questions?.length || 0) + (section.inlineQuestions?.length || 0)
          const isExpanded = expandedSections[si] !== false
          return (
            <div key={si} className="rounded-xl border border-border bg-bg-card overflow-hidden transition-all duration-200 hover:border-border-light">
              <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-bg-card to-bg-secondary/50">
                <button type="button" onClick={() => toggleSection(si)} className="text-text-tertiary hover:text-text-secondary transition-colors">
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', !isExpanded && '-rotate-90')} />
                </button>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {si + 1}
                  </div>
                  <input value={section.title} onChange={(e) => {
                    const sections = [...form.sections]; sections[si] = { ...sections[si], title: e.target.value }; setForm({ ...form, sections })
                  }} disabled={disabled}
                    className="flex-1 bg-transparent text-sm font-medium text-text-primary focus:outline-none placeholder:text-text-tertiary disabled:opacity-50" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                    {sectionQCount} q{sectionQCount !== 1 ? 's' : ''}
                  </span>
                  {form.sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(si)} disabled={disabled}
                      className="p-1.5 text-text-tertiary hover:text-danger hover:bg-danger/10 rounded-lg transition-all disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-border/50">
                  <div className="pt-4">
                    <input value={section.description || ''} onChange={(e) => {
                      const sections = [...form.sections]; sections[si] = { ...sections[si], description: e.target.value }; setForm({ ...form, sections })
                    }} disabled={disabled} placeholder="Section description (optional)"
                      className="w-full bg-transparent text-xs text-text-tertiary focus:outline-none placeholder:text-text-tertiary/50 disabled:opacity-50 py-1" />
                  </div>

                  {section.inlineQuestions?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Pen className="h-3 w-3" /> Written ({section.inlineQuestions.length})
                      </p>
                      <div className="space-y-1.5">
                        {section.inlineQuestions.map((iq, qi) => (
                          <div key={qi} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-primary/5 border border-primary/10 group/iq">
                            <GripVertical className="h-3.5 w-3.5 text-text-tertiary/50 shrink-0" />
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase shrink-0">{iq.questionType.replace('_', ' ')}</span>
                            <span className="flex-1 text-sm text-text-primary truncate">{iq.title}</span>
                            <span className="text-[10px] text-text-tertiary">{iq.marks}m</span>
                            {!disabled && (
                              <button type="button" onClick={() => removeInlineQuestion(si, qi)}
                                className="opacity-0 group-hover/iq:opacity-100 text-text-tertiary hover:text-danger transition-all p-0.5">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.questions?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3" /> From Bank ({section.questions.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                        {questions.filter((q) => section.questions.includes(q._id)).map((q) => (
                          <div key={q._id} className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-sm group/bank">
                            <span className="flex-1 truncate text-text-primary">{q.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 capitalize font-medium">{q.questionType.replace('_', ' ')}</span>
                            {!disabled && (
                              <button type="button" onClick={() => toggleQuestion(si, q._id)}
                                className="opacity-0 group-hover/bank:opacity-100 text-text-tertiary hover:text-danger transition-all p-0.5">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sectionQCount === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-xs text-text-tertiary">No questions yet. Write one below or pick from the bank.</p>
                    </div>
                  )}

                  <InlineQuestionForm onAdd={(q) => addInlineQuestion(si, q)} disabled={disabled} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AIGenerateForm({ onSuccess }) {
  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then((r) => r.data),
  })
  const providers = providersData?.data || []

  const [form, setForm] = useState({
    title: '', topic: '', count: 10, difficulty: 'medium', questionType: 'single_correct',
    provider: 'groq', language: 'English', assessmentType: 'quiz',
    timeLimit: '', passingPercentage: 40, maxAttempts: 1,
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ai/generate-assessment', data),
    onSuccess: (res) => { onSuccess(res.data?.data) },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    data.timeLimit = form.timeLimit ? Number(form.timeLimit) : null
    if (!data.title) delete data.title
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">AI Assessment Generator</h3>
              <p className="text-[11px] text-text-tertiary">Configure and generate a complete assessment with AI</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Topic *</label>
              <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="e.g. JavaScript Closures, React Hooks, System Design" required />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Title <span className="normal-case text-text-tertiary/70">(optional)</span></label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Questions</label>
              <input type="number" min="1" max="50" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                {Object.entries(difficultyConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Type</label>
              <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                {questionTypeOptions.slice(0, 4).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Time (min)</label>
              <input type="number" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="No limit" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Pass %</label>
              <input type="number" min="0" max="100" value={form.passingPercentage} onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-3 block">AI Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia'].map((p) => {
                const prov = providers.find((x) => x.name === p)
                const configured = prov?.configured
                return (
                  <button type="button" key={p} onClick={() => setForm({ ...form, provider: p })}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-all duration-200',
                      form.provider === p
                        ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                        : 'border-border bg-bg-secondary text-text-secondary hover:border-border-light hover:bg-bg-tertiary',
                      !configured && 'opacity-40'
                    )}
                    title={!configured ? `${p} API key not configured` : p}
                  >
                    <Brain className="h-4 w-4 shrink-0" />
                    <span className="capitalize text-xs font-medium">{p}</span>
                    {configured && <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {mutation.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger">AI Generation Failed</p>
            {mutation.error?.response?.data?.errors?.length > 0 ? (
              <ul className="mt-1 text-sm text-text-secondary list-disc list-inside">
                {mutation.error.response.data.errors.map((e, i) => (
                  <li key={i}><span className="font-medium">{e.field}:</span> {e.message}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary mt-1">
                {mutation.error?.response?.data?.message || 'Could not generate assessment. Check your topic and try again.'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!form.topic || mutation.isPending} className="min-w-[180px]">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {mutation.isPending ? 'Generating...' : 'Generate with AI'}
        </Button>
      </div>
    </form>
  )
}

export function ImportForm({ onSuccess, endpoint = '/ai/import-assessment' }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [provider, setProvider] = useState('groq')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then((r) => r.data),
  })
  const providers = providersData?.data || []

  const mutation = useMutation({
    mutationFn: (formData) => api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (res) => {
      const assessment = res.data?.data
      const qCount = assessment?.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0
      setChatMessages((prev) => [
        ...prev,
        { role: 'system', text: qCount > 0
          ? `Assessment "${assessment?.title}" created with ${qCount} questions. Review and submit from the Assessments tab.`
          : `File processed successfully. ${res.data?.data?.count || 0} questions imported.`
        },
      ])
      onSuccess(assessment)
    },
    onError: (err) => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'system', text: `Error: ${err?.response?.data?.message || 'Failed to process file. Please try a different file.'}` },
      ])
    },
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }
  const handleSelect = (e) => { const f = e.target.files[0]; if (f) setFile(f) }

  const handleUpload = () => {
    if (!file) return
    setChatMessages([
      { role: 'user', text: `Uploading "${file.name}" (${(file.size / 1024).toFixed(1)} KB)` },
      { role: 'system', text: 'AI is reading the file and generating questions...' },
    ])
    const fd = new FormData()
    fd.append('file', file)
    fd.append('provider', provider)
    mutation.mutate(fd)
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages((prev) => [...prev, { role: 'user', text: chatInput }])
    setChatMessages((prev) => [...prev, { role: 'system', text: 'This feature is coming soon. For now, the file has been processed and questions have been generated. Go to the Assessments tab to review and submit.' }])
    setChatInput('')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <FileUp className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Import from File</h3>
              <p className="text-[11px] text-text-tertiary">Upload a document and AI will generate questions from its content</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !chatMessages.length && fileRef.current?.click()}
            className={cn(
              'rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300',
              chatMessages.length
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : file
                    ? 'border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50'
                    : 'border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
            )}
          >
            <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleSelect} className="hidden" />
            {chatMessages.length ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">File uploaded successfully</p>
                  <p className="text-xs text-text-tertiary mt-1">{file?.name}</p>
                </div>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{file.name}</p>
                  <p className="text-xs text-text-tertiary mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-danger hover:text-danger/80 font-medium transition-colors">
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary">
                  <Upload className="h-7 w-7 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Drop your file here or click to browse</p>
                  <p className="text-xs text-text-tertiary mt-1">Supports CSV, JSON, Excel, PDF, DOCX, TXT</p>
                </div>
              </div>
            )}
          </div>

          {!chatMessages.length && (
            <div>
              <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-3 block">AI Provider</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia'].map((p) => {
                  const prov = providers.find((x) => x.name === p)
                  const configured = prov?.configured
                  return (
                    <button type="button" key={p} onClick={() => setProvider(p)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200',
                        provider === p
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-bg-secondary text-text-secondary hover:border-border-light',
                        !configured && 'opacity-40'
                      )}
                    >
                      <Brain className="h-4 w-4 shrink-0" />
                      <span className="capitalize text-xs font-medium">{p}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {chatMessages.length > 0 && (
        <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-bg-secondary/50 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary">AI Assistant</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-bg-secondary text-text-primary rounded-bl-md'
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-text-secondary">Processing your file...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!chatMessages.length ? (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Info className="h-3.5 w-3.5" />
            <span>Supported: CSV, JSON, Excel, PDF, DOCX, TXT</span>
          </div>
        ) : <div />}
        <div className="flex items-center gap-3">
          {chatMessages.length > 0 && !mutation.isPending && (
            <Button variant="ghost" onClick={() => { setChatMessages([]); setFile(null) }} size="sm">
              Upload Another
            </Button>
          )}
          {!chatMessages.length && (
            <Button onClick={handleUpload} disabled={!file || mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {mutation.isPending ? 'Processing...' : 'Upload & Generate'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function AssessmentSettings({ form, setForm, editStatus }) {
  const disabled = editStatus === 'pending_approval'
  return (
    <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-bg-card to-bg-secondary/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
            <Settings2 className="h-4 w-4 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Assessment Settings</h3>
            <p className="text-[11px] text-text-tertiary">Configure your assessment details and behavior</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={disabled}
            className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder:text-text-tertiary disabled:opacity-50 transition-all"
            placeholder="e.g. JavaScript Fundamentals Assessment" />
        </div>

        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} disabled={disabled}
            className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none placeholder:text-text-tertiary disabled:opacity-50 transition-all"
            placeholder="Brief description of this assessment..." />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Type</label>
            <select value={form.assessmentType} onChange={(e) => setForm({ ...form, assessmentType: e.target.value })} disabled={disabled}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all">
              <option value="quiz">Quiz</option>
              <option value="coding">Coding</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} disabled={disabled}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all">
              {Object.entries(difficultyConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Time (min)</label>
            <input type="number" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })} disabled={disabled}
              className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
              placeholder="No limit" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Pass %</label>
            <input type="number" min="0" max="100" value={form.passingPercentage} onChange={(e) => setForm({ ...form, passingPercentage: Number(e.target.value) })} disabled={disabled}
              className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-2 block">Max Attempts</label>
            <input type="number" min="1" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} disabled={disabled}
              className="w-full rounded-xl border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all" />
          </div>
        </div>

        <div className="space-y-1">
          {[
            ['shuffleQuestions', 'Shuffle Questions', 'Randomize question order for each attempt'],
            ['showResultImmediately', 'Show Results Immediately', 'Display score right after submission'],
            ['showCorrectAnswers', 'Show Correct Answers', 'Reveal correct answers in results'],
          ].map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between py-2.5 px-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">{label}</p>
                <p className="text-[11px] text-text-tertiary">{desc}</p>
              </div>
              <Toggle checked={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} disabled={disabled} />
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">Negative Marking</p>
              <p className="text-[11px] text-text-tertiary">Deduct marks for wrong answers</p>
            </div>
            <div className="flex items-center gap-3">
              {form.negativeMarking && (
                <input type="number" min="0" step="0.25" value={form.negativeMarkingValue}
                  onChange={(e) => setForm({ ...form, negativeMarkingValue: Number(e.target.value) })}
                  disabled={disabled}
                  className="w-20 rounded-lg border border-border bg-bg-secondary py-1.5 px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-all text-center"
                  placeholder="0" />
              )}
              <Toggle checked={form.negativeMarking} onChange={(v) => setForm({ ...form, negativeMarking: v })} disabled={disabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentCreatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [activeTab, setActiveTab] = useState('manual')

  const selectedIds = searchParams.get('selected')

  const defaultForm = {
    title: '', description: '', assessmentType: 'quiz', difficulty: 'medium',
    timeLimit: '', passingPercentage: 40, maxAttempts: 1,
    shuffleQuestions: false, shuffleOptions: false,
    showResultImmediately: true, showCorrectAnswers: true,
    negativeMarking: false, negativeMarkingValue: 0,
    partialMarking: false, proctoringRequired: false,
    sections: [{ title: 'Section 1', description: '', questions: [], inlineQuestions: [] }],
  }

  const [form, setForm] = useState(defaultForm)

  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.get(`/assessments/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (editData?.data) {
      const a = editData.data
      setForm({
        title: a.title || '',
        description: a.description || '',
        assessmentType: a.assessmentType || 'quiz',
        difficulty: a.difficulty || 'medium',
        timeLimit: a.timeLimit ? String(Math.round(a.timeLimit / 60)) : '',
        passingPercentage: a.passingPercentage ?? 40,
        maxAttempts: a.maxAttempts ?? 1,
        shuffleQuestions: a.shuffleQuestions ?? false,
        shuffleOptions: a.shuffleOptions ?? false,
        showResultImmediately: a.showResultImmediately ?? true,
        showCorrectAnswers: a.showCorrectAnswers ?? true,
        negativeMarking: a.negativeMarking ?? false,
        negativeMarkingValue: a.negativeMarkingValue ?? 0,
        partialMarking: a.partialMarking ?? false,
        proctoringRequired: a.proctoringRequired ?? false,
        sections: a.sections?.length > 0
          ? a.sections.map((s) => ({
              title: s.title || '',
              description: s.description || '',
              questions: (s.questions || []).map((q) => typeof q === 'string' ? q : q._id),
              inlineQuestions: [],
            }))
          : [{ title: 'Section 1', description: '', questions: [], inlineQuestions: [] }],
      })
    }
  }, [editData])

  useEffect(() => {
    if (selectedIds) {
      const ids = selectedIds.split(',').filter(Boolean)
      setForm((prev) => {
        const sections = [...prev.sections]
        const firstSection = { ...sections[0] }
        firstSection.questions = [...new Set([...firstSection.questions, ...ids])]
        sections[0] = firstSection
        return { ...prev, sections }
      })
    }
  }, [selectedIds])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/assessments/${id}`, data) : api.post('/assessments', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      const newId = res?.data?.data?._id
      if (newId) {
        navigate(`/assessments/${newId}/preview`)
      } else {
        navigate('/assessments')
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      timeLimit: form.timeLimit ? Number(form.timeLimit) * 60 : null,
      sections: form.sections.map((s) => ({
        ...s,
        totalMarks: (s.inlineQuestions || []).reduce((sum, q) => sum + (q.marks || 1), 0) + (s.questions?.length || 0),
      })),
    }
    mutation.mutate(data)
  }

  const rejectionReason = editData?.data?.rejectionReason
  const editStatus = editData?.data?.status

  const tabs = [
    { key: 'manual', label: 'Manual', icon: BookOpen, desc: 'Write or pick questions' },
    { key: 'ai', label: 'AI Generate', icon: Sparkles, desc: 'Generate with AI' },
    { key: 'import', label: 'Import File', icon: FileUp, desc: 'AI reads your file' },
  ]

  if (editLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-bg-tertiary" />
          <div className="h-12 rounded-xl bg-bg-tertiary" />
          <div className="h-96 rounded-2xl bg-bg-tertiary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assessments')}
          className="rounded-xl p-2.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">{isEdit ? 'Edit Assessment' : 'Create Assessment'}</h2>
          <p className="mt-0.5 text-sm text-text-secondary">{isEdit ? 'Update assessment details and questions' : 'Choose how you want to build your assessment'}</p>
        </div>
      </div>

      {isEdit && rejectionReason && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger">Rejection Reason</p>
            <p className="text-sm text-text-secondary mt-1">{rejectionReason}</p>
          </div>
        </div>
      )}

      {isEdit && editStatus === 'pending_approval' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-400">This assessment is pending admin approval. Editing is disabled.</p>
        </div>
      )}

      {selectedIds && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-400">{selectedIds.split(',').length} question(s) added from bank. Scroll down to review.</p>
        </div>
      )}

      {!isEdit && (
        <div className="flex gap-3 p-1 bg-bg-secondary rounded-2xl" role="tablist" aria-label="Assessment creation mode">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-left transition-all duration-200',
                activeTab === t.key
                  ? 'bg-bg-card text-primary shadow-sm border border-primary/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
              )}>
              <t.icon className={cn('h-5 w-5 transition-colors', activeTab === t.key ? 'text-primary' : 'text-text-tertiary')} />
              <div>
                <p className={cn('text-sm font-semibold', activeTab === t.key ? 'text-primary' : 'text-text-primary')}>{t.label}</p>
                <p className="text-[10px] text-text-tertiary">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {mutation.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger">Save Failed</p>
            <p className="text-sm text-text-secondary mt-1">{mutation.error?.response?.data?.message || 'Could not save assessment. Please try again.'}</p>
          </div>
        </div>
      )}

      {(isEdit || activeTab === 'manual') && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <AssessmentSettings form={form} setForm={setForm} editStatus={editStatus} />
          <ManualForm form={form} setForm={setForm} isEdit={isEdit} editStatus={editStatus} />
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/assessments')}>Cancel</Button>
            {editStatus !== 'pending_approval' && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Assessment' : 'Save as Draft'}
              </Button>
            )}
          </div>
        </form>
      )}

      {!isEdit && activeTab === 'ai' && (
        <AIGenerateForm onSuccess={(a) => navigate(`/assessments/${a._id}/preview`)} />
      )}

      {!isEdit && activeTab === 'import' && (
        <ImportForm onSuccess={(a) => navigate(`/assessments/${a._id}/preview`)} />
      )}
    </div>
  )
}
