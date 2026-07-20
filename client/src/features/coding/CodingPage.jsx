import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Loader2, AlertCircle, Sparkles, FileText, CheckCircle } from 'lucide-react'
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

const DEFAULT_CODE = {
  javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findGCD = function(nums) {\n    \n};`,
  python: `class Solution:\n    def findGCD(self, nums: List[int]) -> int:\n        pass`,
  java: `class Solution {\n    public int findGCD(int[] nums) {\n        \n    }\n}`,
  cpp: `class Solution {\npublic:\n    int findGCD(vector<int>& nums) {\n        \n    }\n};`,
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
  const [selectedId, setSelectedId] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [results, setResults] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [leftWidth, setLeftWidth] = useState(45)
  const [bottomHeight, setBottomHeight] = useState(200)
  const [leftTab, setLeftTab] = useState('description')
  const timerRef = useRef(null)
  const isDraggingV = useRef(false)
  const isDraggingH = useRef(false)
  const containerRef = useRef(null)

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

  useEffect(() => {
    setLanguage(prev => {
      if (availableLangs.find(l => l.id === prev)) return prev
      return availableLangs[0]?.id || 'javascript'
    })
  }, [availableLangs])

  const { data: problemsData, isLoading, error } = useQuery({
    queryKey: ['coding-problems'],
    queryFn: () => api.get('/questions', { params: { questionType: 'coding', status: 'approved', limit: 50 } }).then(r => r.data),
  })

  const problems = problemsData?.data || []
  const filteredProblems = useMemo(() => {
    if (difficultyFilter === 'all') return problems
    return problems.filter(p => p.difficulty === difficultyFilter)
  }, [problems, difficultyFilter])

  const { data: submissionsData } = useQuery({
    queryKey: ['coding-submissions', selectedId],
    queryFn: () => api.get(`/coding/submissions/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  })

  const { data: bookmarksData } = useQuery({
    queryKey: ['coding-bookmarks'],
    queryFn: () => api.get('/coding/bookmarks').then(r => r.data),
  })

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['coding-comments', selectedId],
    queryFn: () => api.get(`/coding/comments/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  })

  const { data: progressData } = useQuery({
    queryKey: ['coding-progress'],
    queryFn: () => api.get('/coding/progress').then(r => r.data),
  })

  const submissions = submissionsData?.data || []
  const bookmarks = bookmarksData?.data || []
  const comments = commentsData?.data || []
  const isBookmarked = bookmarks.some(b => b.question?._id === selectedId || b.question === selectedId)
  const activeProblem = problems.find(p => p._id === selectedId) || null
  const currentIndex = filteredProblems.findIndex(p => p._id === selectedId)
  const solvedProblems = progressData?.data?.solvedProblems || []

  // Init first problem
  useEffect(() => {
    if (!selectedId && filteredProblems.length > 0) {
      const first = filteredProblems[0]
      setSelectedId(first._id)
      const saved = loadAutosave(first._id)
      if (saved) { setCode(saved.code); setLanguage(saved.lang) }
      else { setCode(first.codingDetails?.starterCodes?.[language] || DEFAULT_CODE[language] || '') }
      setResults(null); setElapsed(0); setTimerActive(false); setHintsUsed(0); setConsoleOutput('')
    }
  }, [filteredProblems, selectedId])

  // Timer
  useEffect(() => {
    if (timerActive && selectedId) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
      return () => clearInterval(timerRef.current)
    }
    if (!timerActive && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [timerActive, selectedId])

  // Autosave
  useEffect(() => {
    if (selectedId && code) {
      const t = setTimeout(() => saveAutosave(selectedId, code, language), 1000)
      return () => clearTimeout(t)
    }
  }, [selectedId, code, language])

  // Keyboard shortcuts
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

  // Resizable handlers
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

  const seedMutation = useMutation({
    mutationFn: () => api.post('/coding/seed').then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coding-problems'] }),
  })

  const runMutation = useMutation({
    mutationFn: (p) => api.post('/coding/run', p).then(r => r.data),
    onSuccess: (res) => {
      setResults(res?.data?.results || [])
      setConsoleOutput((res?.data?.results || []).map((r, i) => `Case ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`).join('\n'))
    },
    onError: () => {},
    onSettled: () => setRunning(false),
  })

  const submitMutation = useMutation({
    mutationFn: (p) => api.post('/coding/submit', p).then(r => r.data),
    onSuccess: (res) => {
      setResults(res?.data?.results || [])
      setConsoleOutput((res?.data?.results || []).map((r, i) => `Case ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`).join('\n'))
      queryClient.invalidateQueries({ queryKey: ['coding-submissions', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['coding-progress'] })
    },
    onError: () => {},
    onSettled: () => setSubmitting(false),
  })

  const bookmarkMutation = useMutation({
    mutationFn: (qid) => api.post(`/coding/bookmarks/${qid}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coding-bookmarks'] }),
  })

  const commentMutation = useMutation({
    mutationFn: ({ qid, content }) => api.post(`/coding/comments/${qid}`, { content }).then(r => r.data),
    onSuccess: () => refetchComments(),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (cid) => api.delete(`/coding/comments/${cid}`).then(r => r.data),
    onSuccess: () => refetchComments(),
  })

  const likeCommentMutation = useMutation({
    mutationFn: (cid) => api.post(`/coding/comments/${cid}/like`).then(r => r.data),
    onSuccess: () => refetchComments(),
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
    setCode(activeProblem.codingDetails?.starterCodes?.[language] || DEFAULT_CODE[language] || '')
    setResults(null); setElapsed(0); setTimerActive(false); setConsoleOutput('')
  }, [activeProblem, language])

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang)
    if (activeProblem) {
      setCode(activeProblem.codingDetails?.starterCodes?.[newLang] || DEFAULT_CODE[newLang] || '')
    } else { setCode(DEFAULT_CODE[newLang] || '') }
  }, [activeProblem])

  const handleSelectProblem = useCallback((id) => {
    const p = filteredProblems.find(x => x._id === id)
    if (!p) return
    setSelectedId(id)
    const saved = loadAutosave(id)
    if (saved) { setCode(saved.code); setLanguage(saved.lang) }
    else { setCode(p.codingDetails?.starterCodes?.[language] || DEFAULT_CODE[language] || '') }
    setResults(null); setElapsed(0); setTimerActive(false); setHintsUsed(0); setConsoleOutput('')
  }, [filteredProblems, language])

  const handleNav = useCallback((dir) => {
    const idx = filteredProblems.findIndex(p => p._id === selectedId)
    const next = idx + dir
    if (next >= 0 && next < filteredProblems.length) handleSelectProblem(filteredProblems[next]._id)
  }, [filteredProblems, selectedId, handleSelectProblem])

  const handleOpenDiscussion = useCallback(() => {
    setLeftTab('discussion')
  }, [])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] -m-6 flex items-center justify-center bg-bg-card">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-text-secondary">Loading problems...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] -m-6 flex items-center justify-center bg-bg-card">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-danger mx-auto" />
          <p className="text-sm text-text-secondary">Failed to load coding problems</p>
        </div>
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] -m-6 flex items-center justify-center bg-bg-card">
        <div className="text-center space-y-4 max-w-md">
          <FileText className="h-12 w-12 text-text-tertiary mx-auto opacity-40" />
          <h3 className="text-lg font-heading font-semibold text-text-primary">No Coding Problems Yet</h3>
          <p className="text-sm text-text-secondary">Click below to generate demo problems.</p>
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="min-w-[200px]">
            {seedMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Demo Problems</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col bg-bg-card overflow-hidden">
      {/* Top Toolbar */}
      <TopToolbar
        elapsed={elapsed}
        timerActive={timerActive}
        onToggleTimer={() => setTimerActive(p => !p)}
        onRun={handleRun}
        onSubmit={handleSubmit}
        running={running}
        submitting={submitting}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        currentIndex={Math.max(0, currentIndex)}
        totalCount={filteredProblems.length}
        onPrev={() => handleNav(-1)}
        onNext={() => handleNav(1)}
        commentCount={comments.length}
        onOpenDiscussion={handleOpenDiscussion}
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-56 border-r border-border bg-bg-card flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Problems ({filteredProblems.length})</p>
                {solvedProblems.length > 0 && (
                  <span className="text-[10px] text-emerald-500 font-medium">{solvedProblems.length} solved</span>
                )}
              </div>
              <div className="flex gap-1">
                {['all', 'easy', 'medium', 'hard'].map(d => (
                  <button key={d} onClick={() => setDifficultyFilter(d)}
                    className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors ${
                      difficultyFilter === d ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredProblems.map((p, i) => {
                const isSolved = solvedProblems.includes(p._id)
                return (
                  <button key={p._id} onClick={() => handleSelectProblem(p._id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors ${
                      selectedId === p._id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-bg-tertiary/50 border-l-2 border-l-transparent'
                    }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-mono text-text-tertiary mt-0.5 w-5 text-right shrink-0">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isSolved && <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />}
                          <p className={`text-xs truncate ${selectedId === p._id ? 'text-primary font-medium' : 'text-text-primary'}`}>{p.title}</p>
                        </div>
                        <span className={`text-[10px] capitalize ${
                          p.difficulty === 'easy' ? 'text-emerald-500' : p.difficulty === 'medium' ? 'text-amber-500' : 'text-red-500'
                        }`}>{p.difficulty}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Left Panel - Problem */}
        <div style={{ width: sidebarOpen ? `calc(${leftWidth}% - ${sidebarOpen ? '14rem' : '0px'})` : `${leftWidth}%` }} className="border-r border-border overflow-hidden shrink-0 flex flex-col">
          <ProblemLeft
            problem={activeProblem}
            submissions={submissions}
            onToggleBookmark={() => bookmarkMutation.mutate(selectedId)}
            isBookmarked={isBookmarked}
            hintsUsed={hintsUsed}
            onUseHint={(i) => setHintsUsed(Math.max(hintsUsed, i + 1))}
            comments={comments}
            onAddComment={(content) => commentMutation.mutate({ qid: selectedId, content })}
            onDeleteComment={(id) => deleteCommentMutation.mutate(id)}
            onLikeComment={(id) => likeCommentMutation.mutate(id)}
            currentUser={currentUser}
            activeTab={leftTab}
            onTabChange={setLeftTab}
          />
        </div>

        {/* Resize Handle - Vertical */}
        <div onMouseDown={onVerticalDrag} className="w-1 hover:bg-primary/30 bg-border/50 cursor-col-resize transition-colors shrink-0" />

        {/* Right Panel - Code + Test */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Code Editor */}
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

          {/* Resize Handle - Horizontal */}
          <div onMouseDown={onHorizontalDrag} className="h-1 hover:bg-primary/30 bg-border/50 cursor-row-resize transition-colors shrink-0" />

          {/* Test Results */}
          <div style={{ height: bottomHeight }} className="border-t border-border shrink-0 overflow-hidden">
            <TestResultsPanel results={results} running={running} consoleOutput={consoleOutput} />
          </div>
        </div>
      </div>
    </div>
  )
}
