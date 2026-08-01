import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  Loader2, Send, ChevronDown, ArrowLeft, Plus, Trash2, History, MessageSquare, PanelLeftClose, Code2,
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
  { id: 'c', label: 'C', monaco: 'c', ext: 'c' },
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
      c: `void helloWorld() {\n    // Write your solution here\n    \n}`,
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

const SESSION_PROBLEM_KEY = 'coding-active-problem'
const SESSION_LANGUAGE_KEY = 'coding-language'
const SESSION_CODE_MAP_KEY = 'coding-code-map'
const CHAT_HISTORY_KEY = 'coding-ai-chats'

function loadSessionJSON(key) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}

function saveSessionJSON(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function loadCodeForProblem(problemId, lang) {
  try {
    const map = JSON.parse(sessionStorage.getItem(SESSION_CODE_MAP_KEY) || '{}')
    return map[problemId]?.[lang] || null
  } catch { return null }
}

function saveCodeForProblem(problemId, lang, code) {
  try {
    const map = JSON.parse(sessionStorage.getItem(SESSION_CODE_MAP_KEY) || '{}')
    if (!map[problemId]) map[problemId] = {}
    map[problemId][lang] = code
    sessionStorage.setItem(SESSION_CODE_MAP_KEY, JSON.stringify(map))
  } catch {}
}

function loadConversations() {
  try { return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]') } catch { return [] }
}

function saveConversations(convs) {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(convs)) } catch {}
}

function createConversation() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default function CodingPage() {
  const { mode } = useAppSelector((s) => s.theme)
  const { user: currentUser } = useAppSelector((s) => s.auth)
  const [language, setLanguage] = useState(() => loadSessionJSON(SESSION_LANGUAGE_KEY) || 'cpp')
  const [activeProblem, setActiveProblem] = useState(() => loadSessionJSON(SESSION_PROBLEM_KEY) || HELLO_WORLD_PROBLEM)
  const [code, setCode] = useState(() => {
    const savedLang = loadSessionJSON(SESSION_LANGUAGE_KEY) || 'cpp'
    const savedProblem = loadSessionJSON(SESSION_PROBLEM_KEY) || HELLO_WORLD_PROBLEM
    const savedCode = loadCodeForProblem(savedProblem._id, savedLang)
    return savedCode || savedProblem.codingDetails?.starterCodes?.[savedLang] || ''
  })
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
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const chatEndRef = useRef(null)
  const [mobileView, setMobileView] = useState('editor')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const editorTheme = mode === 'dark' ? 'vs-dark' : 'vs'

  useEffect(() => { saveSessionJSON(SESSION_PROBLEM_KEY, activeProblem) }, [activeProblem])
  useEffect(() => { saveSessionJSON(SESSION_LANGUAGE_KEY, language) }, [language])
  useEffect(() => { saveCodeForProblem(activeProblem._id, language, code) }, [code, activeProblem._id, language])

  const { data: langsData } = useQuery({
    queryKey: ['coding-languages'],
    queryFn: () => api.get('/coding/languages').then(r => r.data),
    staleTime: 600000,
  })

  const langs = langsData?.data || []
  const mergedLanguages = langs.length
    ? LANGUAGES.map(sLang => ({ ...sLang, available: langs.find(l => l.id === sLang.id)?.available ?? false }))
    : LANGUAGES.map(l => ({ ...l, available: true }))
  const availableLangs = mergedLanguages

  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.get('/ai/providers').then(r => r.data),
  })
  const providers = providersData?.data || []

  useEffect(() => {
    if (availableLangs.length === 0) return
    setLanguage(prev => {
      if (prev === 'cpp') return 'cpp'
      if (availableLangs.find(l => l.id === prev)) return prev
      return 'cpp'
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
    const saved = loadConversations()
    setConversations(saved)
    if (saved.length > 0) {
      const last = saved[saved.length - 1]
      setActiveConvId(last.id)
      setChatMessages(last.messages)
    }
  }, [])

  const lastLoadedConvRef = useRef(null)

  useEffect(() => {
    if (!activeConvId) return
    if (lastLoadedConvRef.current === activeConvId) return
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv) {
      lastLoadedConvRef.current = activeConvId
      setChatMessages(conv.messages)
    }
  }, [activeConvId, conversations])

  const onVerticalDrag = useCallback((_e) => {
    isDraggingV.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev) => {
      if (!isDraggingV.current || !containerRef.current) return
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.min(Math.max(pct, 25), 70))
    }
    const onUp = () => { isDraggingV.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
  }, [])

  const onHorizontalDrag = useCallback((e) => {
    isDraggingH.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    const startY = e.touches ? e.touches[0].clientY : e.clientY
    const startH = bottomHeight
    const onMove = (ev) => {
      if (!isDraggingH.current) return
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const diff = startY - clientY
      setBottomHeight(Math.min(Math.max(startH + diff, 100), 500))
    }
    const onUp = () => { isDraggingH.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
  }, [bottomHeight])

  const activeConvIdRef = useRef(activeConvId)
  activeConvIdRef.current = activeConvId

  const updateConversation = useCallback((convId, getMessages) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === convId)
      if (idx === -1) return prev
      const updated = [...prev]
      const messages = typeof getMessages === 'function' ? getMessages(updated[idx].messages) : getMessages
      const title = messages.length > 0 && messages[0].role === 'user'
        ? messages[0].text.slice(0, 40) + (messages[0].text.length > 40 ? '...' : '')
        : updated[idx].title
      updated[idx] = { ...updated[idx], title, messages, updatedAt: Date.now() }
      saveConversations(updated)
      return updated
    })
  }, [])

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
      const convId = activeConvIdRef.current
      if (!q) {
        if (convId) {
          setChatMessages(prev => {
            const updated = [...prev, { role: 'assistant', text: 'Could not generate a question. Please try again.' }]
            updateConversation(convId, updated)
            return updated
          })
        }
        return
      }
      const details = q.codingDetails || {}
      const starterCodes = details.starterCodes || {}
      const testCases = details.testCases || []
      const constraints = details.constraints || []
      const hints = details.hints || []
      const topics = details.topics || []
      const rawDescription = q.description || ''
      let cleanDescription = rawDescription
        .replace(/Example\s+\d+[\s\S]*?(?=Example\s+\d+|Constraints:|$)/gi, '')
        .replace(/Constraints:[\s\S]*$/gi, '')
        .trim()
      const fullDescription = cleanDescription || `<p>${q.title}</p>`
      const dynamicProblem = {
        _id: q._id,
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
      if (convId) {
        setChatMessages(prev => {
          const updated = [...prev, { role: 'assistant', text: `Here's your question: "${q.title}"\n\nClick "Description" to see full details. Starter code has been loaded in the editor.` }]
          updateConversation(convId, updated)
          return updated
        })
      }
    },
    onError: (err) => {
      const convId = activeConvIdRef.current
      if (convId) {
        setChatMessages(prev => {
          const updated = [...prev, { role: 'assistant', text: `Error: ${err?.response?.data?.message || 'Failed to generate question. Please try again.'}` }]
          updateConversation(convId, updated)
          return updated
        })
      }
    },
  })

  const handleRun = useCallback(() => {
    if (!activeProblem) return
    setRunning(true); setResults(null); setConsoleOutput('')
    runMutation.mutate({ code, language, questionId: activeProblem._id })
  }, [code, language, activeProblem, runMutation])

  const handleSubmit = useCallback(() => {
    if (!activeProblem) return
    setSubmitting(true); setResults(null); setConsoleOutput('')
    submitMutation.mutate({ code, language, questionId: activeProblem._id })
  }, [code, language, activeProblem, submitMutation])

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
  }, [code, language, activeProblem, handleRun, handleSubmit])

  const handleReset = useCallback(() => {
    if (!activeProblem) return
    const starter = activeProblem.codingDetails?.starterCodes?.[language] || ''
    setCode(starter)
    saveCodeForProblem(activeProblem._id, language, starter)
    setResults(null); setElapsed(0); setTimerActive(false); setConsoleOutput('')
  }, [activeProblem, language])

  const handleLanguageChange = useCallback((newLang) => {
    if (activeProblem) {
      saveCodeForProblem(activeProblem._id, language, code)
      const saved = loadCodeForProblem(activeProblem._id, newLang)
      setCode(saved || activeProblem.codingDetails?.starterCodes?.[newLang] || '')
    }
    setLanguage(newLang)
  }, [activeProblem, language, code])

  const handleNewChat = useCallback(() => {
    const conv = createConversation()
    setConversations(prev => {
      const updated = [...prev, conv]
      saveConversations(updated)
      return updated
    })
    setActiveConvId(conv.id)
    setChatMessages([])
    setShowHistory(false)
  }, [])

  const handleDeleteConversation = useCallback((id, e) => {
    e.stopPropagation()
    const isActive = activeConvId === id
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== id)
      if (remaining.length === 0) {
        const conv = createConversation()
        setActiveConvId(conv.id)
        setChatMessages([])
        saveConversations([conv])
        return [conv]
      }
      if (isActive) {
        const last = remaining[remaining.length - 1]
        setActiveConvId(last.id)
        setChatMessages(last.messages)
      }
      saveConversations(remaining)
      return remaining
    })
  }, [activeConvId])

  const handleSwitchConversation = useCallback((id) => {
    setActiveConvId(id)
    setShowHistory(false)
  }, [])

  const handleChatSend = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    let convId = activeConvId
    const userText = chatInput
    setChatInput('')

    if (!convId) {
      const conv = createConversation()
      convId = conv.id
      setActiveConvId(convId)
      setConversations(prev => {
        const updated = [...prev, conv]
        saveConversations(updated)
        return updated
      })
    }

    const msgs = [
      { role: 'user', text: userText },
      { role: 'assistant', text: 'Generating a coding question for you...' },
    ]
    setChatMessages(prev => {
      const updated = [...prev, ...msgs]
      updateConversation(convId, updated)
      return updated
    })
    aiGenerateMutation.mutate(userText)
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

      {/* Mobile tab switcher */}
      {isMobile && !showAIChat && (
        <div className="flex border-b border-border bg-bg-card shrink-0">
          <button
            onClick={() => setMobileView('problem')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2',
              mobileView === 'problem'
                ? 'text-primary border-primary bg-primary/5'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            )}
          >
            <PanelLeftClose className="h-3.5 w-3.5" /> Problem
          </button>
          <button
            onClick={() => setMobileView('editor')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2',
              mobileView === 'editor'
                ? 'text-primary border-primary bg-primary/5'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            )}
          >
            <Code2 className="h-3.5 w-3.5" /> Editor
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* AI Chat Panel */}
        {showAIChat && (
          <div className={cn(
            'border-r border-border bg-bg-card flex flex-col shrink-0',
            isMobile ? 'w-full' : 'w-80'
          )}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                <span className="text-sm font-bold text-primary shrink-0">AI</span>
                <span className="text-sm font-semibold text-text-primary truncate">
                  {showHistory ? 'History' : 'Practice'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!showHistory && (
                  <button onClick={handleNewChat}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
                    title="New Chat">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => { setShowHistory(p => !p); setShowProviderSelect(false) }}
                  className={cn('p-1.5 rounded-lg transition-colors',
                    showHistory ? 'bg-primary/10 text-primary' : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary')}
                  title="Chat History">
                  <History className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowProviderSelect(p => !p)}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors">
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
            </div>

            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.length === 0 && (
                  <div className="text-center py-8 text-sm text-text-secondary">No conversations yet</div>
                )}
                {[...conversations].reverse().map((conv) => (
                  <div key={conv.id}
                    onClick={() => handleSwitchConversation(conv.id)}
                    className={cn(
                      'flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group',
                      activeConvId === conv.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-bg-tertiary text-text-secondary'
                    )}>
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{conv.title}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 rounded-md text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Left Panel - Problem */}
        <div
          style={!isMobile ? { width: `${leftWidth}%` } : undefined}
          className={cn(
            'border-r border-border overflow-hidden shrink-0 flex flex-col',
            isMobile ? (mobileView === 'problem' ? 'flex-1' : 'hidden') : ''
          )}
        >
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

        {!isMobile && <div onMouseDown={onVerticalDrag} onTouchStart={onVerticalDrag} className="w-1 hover:bg-primary/30 bg-border/50 cursor-col-resize transition-colors shrink-0" />}

        <div className={cn(
          'flex-1 flex flex-col overflow-hidden',
          isMobile ? (mobileView === 'editor' ? 'flex-1' : 'hidden') : ''
        )}>
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

          {!isMobile && <div onMouseDown={onHorizontalDrag} onTouchStart={onHorizontalDrag} className="h-1 hover:bg-primary/30 bg-border/50 cursor-row-resize transition-colors shrink-0" />}

          <div style={isMobile ? { height: 150 } : { height: bottomHeight }} className="border-t border-border shrink-0 overflow-hidden">
            <TestResultsPanel results={results} running={running} consoleOutput={consoleOutput} error={runError} />
          </div>
        </div>
      </div>
    </div>
  )
}
