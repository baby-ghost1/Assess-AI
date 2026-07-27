import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  Loader2, Send, ChevronDown, ArrowLeft,
} from 'lucide-react'
import TopToolbar from './TopToolbar'
import ProblemLeft from './ProblemLeft'
import CodeEditorPanel from './CodeEditorPanel'
import TestResultsPanel from './TestResultsPanel'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', ext: 'js' },
  { id: 'python', label: 'Python3', monaco: 'python', ext: 'py' },
  { id: 'java', label: 'Java', monaco: 'java', ext: 'java' },
  { id: 'cpp', label: 'C++', monaco: 'cpp', ext: 'cpp' },
]

const HELLO_WORLD_PROBLEM = {
  _id: 'hello-world',
  title: 'Hello World',
  description: `<p>Write a program that prints <code>Hello, World!</code> to the console.</p>
<p>This is the classic first program that every programmer writes when learning a new language. It's simple, but it's the beginning of your coding journey!</p>`,
  difficulty: 'easy',
  questionType: 'coding',
  marks: 1,
  codingDetails: {
    starterCodes: {
      javascript: `function helloWorld() {\n    // Write your solution here\n    \n}`,
      python: `def hello_world():\n    # Write your solution here\n    pass`,
      java: `class Solution {\n    public void helloWorld() {\n        // Write your solution here\n        \n    }\n}`,
      cpp: `class Solution {\npublic:\n    void helloWorld() {\n        // Write your solution here\n        \n    }\n};`,
    },
    constraints: [],
    testCases: [
      { input: '(no input)', output: 'Hello, World!', isHidden: false, description: 'Should print exactly "Hello, World!"' },
    ],
    hints: ['Use the print/output function of your language.'],
    topics: ['Basics'],
    companies: [],
  },
}

const AUTOSAVE_KEY = 'coding-workspace-save'

function loadAutosave(id) {
  try { const d = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || '{}'); return d[id] || null } catch { return null }
}

function saveAutosave(id, code, lang) {
  try { const d = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || '{}'); d[id] = { code, lang, at: Date.now() }; localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(d)) } catch {}
}

function clearAutosave(id) {
  try { const d = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || '{}'); delete d[id]; localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(d)) } catch {}
}

export default function CodingPage() {
  const { mode } = useAppSelector((s) => s.theme)
  const { user: currentUser } = useAppSelector((s) => s.auth)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(HELLO_WORLD_PROBLEM.codingDetails.starterCodes.javascript)
  const [results, setResults] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [runError, setRunError] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [leftWidth, setLeftWidth] = useState(45)
  const [bottomHeight, setBottomHeight] = useState(200)
  const [leftTab, setLeftTab] = useState('description')
  const timerRef = useRef(null)
  const isDraggingV = useRef(false)
  const isDraggingH = useRef(false)
  const containerRef = useRef(null)

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiProvider, setAiProvider] = useState('groq')
  const [showProviderSelect, setShowProviderSelect] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [activeProblem, setActiveProblem] = useState(HELLO_WORLD_PROBLEM)
  const chatEndRef = useRef(null)

  const editorTheme = mode === 'dark' ? 'vs-dark' : 'vs'

  const { data: langsData } = useQuery({
    queryKey: ['coding-languages'],
    queryFn: () => api.get('/coding/languages').then(r => r.data),
    staleTime: 600000,
  })

  const langs = langsData?.data || []
  const mergedLanguages = langs.length
    ? LANGUAGES.map(sLang => ({ ...sLang, available: langs.find(l => l.id === sLang.id)?.available ?? false }))
    : LANGUAGES
  const availableLangs = mergedLanguages.filter(l => l.available)

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then(r => r.data),
  })
  const providers = providersData?.data || []

  useEffect(() => {
    setLanguage(prev => {
      if (availableLangs.find(l => l.id === prev)) return prev
      return availableLangs[0]?.id || 'javascript'
    })
  }, [availableLangs])

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
      return () => clearInterval(timerRef.current)
    }
    if (!timerActive && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [timerActive])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) handleSubmit(); else handleRun()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, language, activeProblem])

  const onVerticalDrag = useCallback((_e) => {
    isDraggingV.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev) => {
      if (!isDraggingV.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.min(Math.max(pct, 25), 70))
    }
    const onUp = () => { isDraggingV.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const onHorizontalDrag = useCallback((e) => {
    isDraggingH.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    const startY = e.clientY
    const startH = bottomHeight
    const onMove = (ev) => {
      if (!isDraggingH.current) return
      const diff = startY - ev.clientY
      setBottomHeight(Math.min(Math.max(startH + diff, 100), 500))
    }
    const onUp = () => { isDraggingH.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [bottomHeight])

  const queryClient = useQueryClient()

  const runMutation = useMutation({
    mutationFn: (p) => api.post('/coding/run', p).then(r => r.data),
    onSuccess: (res) => {
      setRunError('')
      setResults(res?.data?.results || [])
      setConsoleOutput((res?.data?.results || []).map((r, i) => `Case ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`).join('\n'))
    },
    onError: (err) => {
      setRunError(err?.response?.data?.message || 'Failed to run code. Please try again.')
      setConsoleOutput('')
    },
    onSettled: () => setRunning(false),
  })

  const submitMutation = useMutation({
    mutationFn: (p) => api.post('/coding/submit', p).then(r => r.data),
    onSuccess: (res) => {
      setRunError('')
      setResults(res?.data?.results || [])
      setConsoleOutput((res?.data?.results || []).map((r, i) => `Case ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`).join('\n'))
    },
    onError: (err) => {
      setRunError(err?.response?.data?.message || 'Failed to submit code. Please try again.')
      setConsoleOutput('')
    },
    onSettled: () => setSubmitting(false),
  })

  const aiGenerateMutation = useMutation({
    mutationFn: (topic) => api.post('/ai/generate', {
      topic,
      count: 1,
      difficulty: 'medium',
      questionType: 'coding',
      provider: aiProvider,
    }).then(r => r.data),
    onSuccess: (res) => {
      const q = res?.data?.questions?.[0]
      if (!q) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Could not generate a question. Please try again.' }])
        return
      }
      // Server returns codingDetails from Question model
      const details = q.codingDetails || {}
      const starterCodes = details.starterCodes || {}
      const testCases = details.testCases || []
      const constraints = details.constraints || []
      const hints = details.hints || []
      const topics = details.topics || []
      const rawDescription = q.description || ''

      // Strip examples/constraints from AI description (we'll render them as formatted HTML)
      let cleanDescription = rawDescription
        .replace(/Example\s+\d+[\s\S]*?(?=Example\s+\d+|Constraints:|$)/gi, '')
        .replace(/Constraints:[\s\S]*$/gi, '')
        .trim()

      const fullDescription = cleanDescription || `<p>${q.title}</p>`

      const dynamicProblem = {
        _id: `ai-${Date.now()}`,
        title: q.title,
        description: fullDescription,
        difficulty: q.difficulty || 'medium',
        questionType: 'coding',
        codingDetails: {
          starterCodes: {
            javascript: starterCodes.javascript || starterCodes.js || `function solution() {\n    // Write your solution here\n}`,
            python: starterCodes.python || starterCodes.py || `def solution():\n    # Write your solution here\n    pass`,
            java: starterCodes.java || `class Solution {\n    public int solve(int[] nums) {\n        // Write your solution here\n        return -1;\n    }\n}`,
            cpp: starterCodes.cpp || starterCodes['c++'] || `class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // Write your solution here\n        return -1;\n    }\n};`,
          },
          constraints,
          testCases,
          hints,
          topics,
          companies: details.companies || [],
        },
        marks: q.marks || 1,
      }
      setActiveProblem(dynamicProblem)
      setCode(dynamicProblem.codingDetails.starterCodes[language] || '')
      setLeftTab('description')
      setHintsUsed(0)
      setResults(null)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Here's your question: "${q.title}"\n\nClick "Description" to see full details. Starter code has been loaded in the editor.`,
      }])
    },
    onError: (err) => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Error: ${err?.response?.data?.message || 'Failed to generate question. Please try again.'}`,
      }])
    },
  })

  const handleRun = useCallback(() => {
    if (!activeProblem) return
    setRunning(true); setResults(null); setConsoleOutput('')
    runMutation.mutate({ code, language, questionId: activeProblem._id })
  }, [code, language, activeProblem])

  const handleSubmit = useCallback(() => {
    if (!activeProblem) return
    setSubmitting(true); setResults(null); setConsoleOutput('')
    submitMutation.mutate({ code, language, questionId: activeProblem._id })
  }, [code, language, activeProblem])

  const handleReset = useCallback(() => {
    if (!activeProblem) return
    clearAutosave(activeProblem._id)
    setCode(activeProblem.codingDetails?.starterCodes?.[language] || '')
    setResults(null); setElapsed(0); setTimerActive(false); setConsoleOutput('')
  }, [activeProblem, language])

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang)
    if (activeProblem) {
      setCode(activeProblem.codingDetails?.starterCodes?.[newLang] || '')
    }
  }, [activeProblem])

  const handleChatSend = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }])
    setChatMessages(prev => [...prev, { role: 'assistant', text: 'Generating a coding question for you...' }])
    aiGenerateMutation.mutate(chatInput)
    setChatInput('')
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col bg-bg-card overflow-hidden">
      <TopToolbar
        elapsed={elapsed}
        timerActive={timerActive}
        onToggleTimer={() => setTimerActive(p => !p)}
        onRun={handleRun}
        onSubmit={handleSubmit}
        running={running}
        submitting={submitting}
        onToggleSidebar={() => setShowAIChat(p => !p)}
        sidebarOpen={showAIChat}
        commentCount={0}
        onOpenDiscussion={() => setLeftTab('discussion')}
      />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* AI Chat Panel */}
        {showAIChat && (
          <div className="w-80 border-r border-border bg-bg-card flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">AI</span>
                <span className="text-sm font-semibold text-text-primary">Practice</span>
              </div>
              <div className="relative">
                <button onClick={() => setShowProviderSelect(p => !p)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors">
                  <span className="capitalize">{aiProvider}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showProviderSelect && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-bg-card border border-border rounded-xl shadow-xl py-1 w-40">
                    {providers.filter(p => p.configured).map((p) => (
                      <button key={p.name} onClick={() => { setAiProvider(p.name); setShowProviderSelect(false) }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-2',
                          aiProvider === p.name && 'bg-primary/10 text-primary'
                        )}>
                        <span className="text-[10px] font-bold text-primary">AI</span>
                        <span className="capitalize">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <span className="text-2xl font-bold text-primary/30">AI</span>
                  <p className="text-sm text-text-secondary">Ask AI for a coding practice question</p>
                  <p className="text-[11px] text-text-tertiary">e.g. "Give me a medium array question"</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-bg-secondary text-text-primary rounded-bl-md'
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiGenerateMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-text-secondary">Generating question...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSend} className="p-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Ask for a practice question..."
                  disabled={aiGenerateMutation.isPending}
                />
                <Button type="submit" size="sm" disabled={!chatInput.trim() || aiGenerateMutation.isPending} className="h-10 w-10 rounded-xl p-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Left Panel - Problem */}
        <div style={{ width: `${leftWidth}%` }} className="border-r border-border overflow-hidden shrink-0 flex flex-col">
          {showAIChat && activeProblem?._id?.startsWith('ai-') ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
                <button onClick={() => { setShowAIChat(false) }}
                  className="p-1 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-primary">AI Generated Question</span>
                <span className="text-[10px] text-text-tertiary ml-auto capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeProblem.difficulty}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ProblemLeft
                  problem={activeProblem}
                  submissions={[]}
                  onToggleBookmark={() => {}}
                  isBookmarked={false}
                  hintsUsed={hintsUsed}
                  onUseHint={(i) => setHintsUsed(Math.max(hintsUsed, i + 1))}
                  comments={[]}
                  onAddComment={() => {}}
                  onDeleteComment={() => {}}
                  onLikeComment={() => {}}
                  currentUser={currentUser}
                  activeTab={leftTab}
                  onTabChange={setLeftTab}
                />
              </div>
            </div>
          ) : (
            <ProblemLeft
              problem={activeProblem}
              submissions={[]}
              onToggleBookmark={() => {}}
              isBookmarked={false}
              hintsUsed={hintsUsed}
              onUseHint={(i) => setHintsUsed(Math.max(hintsUsed, i + 1))}
              comments={[]}
              onAddComment={() => {}}
              onDeleteComment={() => {}}
              onLikeComment={() => {}}
              currentUser={currentUser}
              activeTab={leftTab}
              onTabChange={setLeftTab}
            />
          )}
        </div>

        <div onMouseDown={onVerticalDrag} className="w-1 hover:bg-primary/30 bg-border/50 cursor-col-resize transition-colors shrink-0" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div style={{ flex: 1, minHeight: 0 }}>
            <CodeEditorPanel
              language={language}
              code={code}
              onChange={setCode}
              onLanguageChange={handleLanguageChange}
              onReset={handleReset}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              editorTheme={editorTheme}
              languages={availableLangs}
            />
          </div>

          <div onMouseDown={onHorizontalDrag} className="h-1 hover:bg-primary/30 bg-border/50 cursor-row-resize transition-colors shrink-0" />

          <div style={{ height: bottomHeight }} className="border-t border-border shrink-0 overflow-hidden">
            <TestResultsPanel results={results} running={running} consoleOutput={consoleOutput} error={runError} />
          </div>
        </div>
      </div>
    </div>
  )
}
