import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import api from '@/lib/api'
import {
  Loader2, Play, CheckCircle, XCircle, Timer, RotateCcw,
  Terminal, FileText, AlertCircle, Sparkles, Bookmark, BookmarkCheck,
  Lightbulb, MessageSquare, Share2, Send, ThumbsUp, Trash2,
  Clock, Cpu, PanelLeftClose, PanelLeft, Plus, Minus, Code,
  ChevronLeft, ChevronRight, X, Eye, EyeOff, Copy,
  Users, MessageCircle,
  WrapText, Undo2, Maximize2, Bookmark as BookmarkIcon,
  ChevronDown, ChevronUp, Lock, Zap, CircleDot
} from 'lucide-react'
import Editor from '@monaco-editor/react'

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

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-500 bg-red-500/10 border-red-500/20',
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatMs(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
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

/* ─── Top Toolbar ─── */
function TopToolbar({ problem, elapsed, timerActive, onToggleTimer, onRun, onSubmit, running, submitting, sidebarOpen, onToggleSidebar, currentIndex, totalCount, onPrev, onNext }) {
  return (
    <div className="h-11 flex items-center justify-between px-3 border-b border-border bg-bg-card shrink-0 select-none">
      <div className="flex items-center gap-2">
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors" title="Toggle sidebar">
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <button onClick={onPrev} className="p-1 rounded hover:bg-bg-tertiary transition-colors" title="Previous"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="min-w-[4rem] text-center font-medium text-text-primary">{currentIndex + 1} / {totalCount}</span>
          <button onClick={onNext} className="p-1 rounded hover:bg-bg-tertiary transition-colors" title="Next"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onRun} disabled={running || submitting}
          className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-border text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-40">
          <Play className="h-3 w-3" /> Run
        </button>
        <button onClick={onSubmit} disabled={submitting || running}
          className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-40">
          <CheckCircle className="h-3 w-3" /> Submit
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-text-secondary">
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono font-medium tabular-nums">{formatTime(elapsed)}</span>
          <button onClick={onToggleTimer} className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-bg-tertiary transition-colors">
            {timerActive ? 'Pause' : 'Start'}
          </button>
        </div>
        <div className="relative">
          <button className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
            <MessageCircle className="h-4 w-4" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-[9px] font-bold bg-danger text-white rounded-full flex items-center justify-center">0</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Problem Left Panel ─── */
function ProblemLeft({ problem, submissions, onToggleBookmark, isBookmarked, hintsUsed, onUseHint, comments, onAddComment, onDeleteComment, onLikeComment, currentUser }) {
  const [tab, setTab] = useState('description')
  const [commentText, setCommentText] = useState('')
  const [seenInInterview, setSeenInInterview] = useState(null)
  const [showTopics, setShowTopics] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)

  if (!problem) return null

  const constraints = problem.codingDetails?.constraints || []
  const companies = problem.codingDetails?.companies || []
  const topics = problem.codingDetails?.topics || []
  const hints = problem.codingDetails?.hints || []
  const acceptanceRate = problem.codingDetails?.acceptanceRate || 0
  const totalAccepted = problem.codingDetails?.totalAccepted || 0
  const totalSubmissions = problem.codingDetails?.totalSubmissions || 0
  const discussionCount = problem.codingDetails?.discussionCount || 0

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-card">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border px-4 shrink-0">
        {[
          { id: 'description', icon: FileText, label: 'Description' },
          { id: 'editorial', icon: Code, label: 'Editorial' },
          { id: 'solutions', icon: Lightbulb, label: 'Solutions' },
          { id: 'submissions', icon: CheckCircle, label: 'Submissions' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onToggleBookmark}
          className={`p-1.5 rounded-md transition-colors ${isBookmarked ? 'text-amber-400' : 'text-text-tertiary hover:text-text-secondary'}`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this problem'}>
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'description' && (
          <div className="p-5 space-y-5 max-w-2xl">
            {/* Title */}
            <h1 className="text-xl font-bold text-text-primary leading-snug">{problem.title}</h1>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLORS[problem.difficulty] || 'text-text-secondary bg-bg-tertiary border-border'}`}>
                {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
              </span>
              <button onClick={() => setShowTopics(!showTopics)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-text-secondary hover:bg-bg-tertiary transition-colors">
                <Code className="h-3 w-3" /> Topics {showTopics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button onClick={() => setShowCompanies(!showCompanies)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-text-secondary hover:bg-bg-tertiary transition-colors">
                <Users className="h-3 w-3" /> Companies {showCompanies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-text-secondary hover:bg-bg-tertiary transition-colors relative">
                <Lightbulb className="h-3 w-3" /> Hint
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
              </button>
            </div>

            {/* Topics dropdown */}
            {showTopics && topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mt-2">
                {topics.map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{t}</span>
                ))}
              </div>
            )}

            {/* Companies dropdown */}
            {showCompanies && companies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mt-2">
                {companies.map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{c}</span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="text-sm text-text-primary leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: problem.description }} />

            {/* Examples */}
            {problem.codingDetails?.testCases?.filter(tc => !tc.isHidden).map((tc, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-bold text-text-primary">Example {i + 1}:</p>
                <div className="rounded-lg bg-bg-tertiary/50 p-3 font-mono text-sm space-y-0.5">
                  <p><span className="font-bold text-text-primary">Input:</span> <span className="text-text-secondary">{tc.input || '(no input)'}</span></p>
                  <p><span className="font-bold text-text-primary">Output:</span> <span className="text-text-secondary">{tc.output}</span></p>
                  {tc.description && <p><span className="font-bold text-text-primary">Explanation:</span> <span className="text-text-secondary">{tc.description}</span></p>}
                </div>
              </div>
            ))}

            {problem.codingDetails?.testCases?.filter(tc => tc.isHidden).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-text-tertiary py-2">
                <Lock className="h-3 w-3" />
                <span>{problem.codingDetails.testCases.filter(tc => tc.isHidden).length} hidden test case(s) — not shown</span>
              </div>
            )}

            {/* Constraints - after examples */}
            {constraints.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-text-primary">Constraints:</p>
                <ul className="space-y-0.5 ml-4">
                  {constraints.map((c, i) => (
                    <li key={i} className="text-sm text-text-secondary list-disc">{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Seen in Interview - before discussion */}
            <div className="flex items-center gap-3 py-3 border-t border-border">
              <span className="text-xs text-text-secondary">Seen this question in a real interview before?</span>
              <button onClick={() => setSeenInInterview(true)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${seenInInterview === true ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-medium' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
                Yes
              </button>
              <button onClick={() => setSeenInInterview(false)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${seenInInterview === false ? 'bg-red-500/10 border-red-500/30 text-red-500 font-medium' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
                No
              </button>
            </div>

            {/* Discussion link */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <MessageSquare className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{discussionCount} discussions</span>
            </div>
          </div>
        )}

        {tab === 'editorial' && (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center space-y-2">
              <Code className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm">Editorial content coming soon</p>
            </div>
          </div>
        )}

        {tab === 'solutions' && (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center space-y-2">
              <Lightbulb className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm">Submit a solution to view yours</p>
            </div>
          </div>
        )}

        {tab === 'submissions' && (
          <div className="flex-1 overflow-y-auto">
            {submissions && submissions.length > 0 ? (
              <div className="divide-y divide-border">
                {submissions.map((sub) => (
                  <div key={sub._id} className="px-4 py-3 hover:bg-bg-tertiary/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.allPassed ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span className="text-sm font-medium text-text-primary">{sub.allPassed ? 'Accepted' : 'Wrong Answer'}</span>
                      </div>
                      <span className="text-xs text-text-tertiary">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatMs(sub.executionTime)}</span>
                      <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {formatBytes(sub.memoryUsed)}</span>
                      <span>{sub.passed}/{sub.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <p className="text-sm">No submissions yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Code Editor Panel ─── */
function CodeEditorPanel({ language, code, onChange, onLanguageChange, onReset, fontSize, onFontSizeChange, editorTheme, cursorPos, languages }) {
  return (
    <div className="flex flex-col h-full bg-bg-card">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Code className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-text-primary">Code</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="p-1 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Reset code">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-text-tertiary">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
      </div>

      {/* Language selector row */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)}
            className="text-xs font-medium bg-transparent border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
            {languages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <Lock className="h-3 w-3" />
            <span>Auto</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Format code"><WrapText className="h-3.5 w-3.5" /></button>
          <button className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Bookmark"><BookmarkIcon className="h-3.5 w-3.5" /></button>
          <button className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Code Snippets"><Code className="h-3.5 w-3.5" /></button>
          <button className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
          <button className="p-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors" title="Expand"><Maximize2 className="h-3.5 w-3.5" /></button>
          <div className="flex items-center gap-0.5 ml-1 border border-border rounded">
            <button onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))} className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary rounded-l transition-colors"><Minus className="h-3 w-3" /></button>
            <span className="text-[10px] text-text-tertiary min-w-[2rem] text-center">{fontSize}px</span>
            <button onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))} className="p-1 text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary rounded-r transition-colors"><Plus className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={languages.find(l => l.id === language)?.monaco || 'javascript'}
          value={code}
          onChange={(val) => onChange(val || '')}
          theme={editorTheme}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              editor._cursorPos = { line: e.position.lineNumber, col: e.position.column }
            })
            editor._cursorPos = { line: 1, col: 1 }
          }}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: false,
            renderWhitespace: 'selection',
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>Saved</span>
          <Lock className="h-3 w-3" />
          <span className="text-primary/80 cursor-pointer hover:text-primary">Upgrade to Cloud Saving</span>
        </div>
        <span className="text-xs text-text-tertiary font-mono">Ln {cursorPos.line}, Col {cursorPos.col}</span>
      </div>
    </div>
  )
}

/* ─── Test Results Bottom Panel ─── */
function TestResultsPanel({ results, running, consoleOutput }) {
  const [tab, setTab] = useState('testcase')
  const [activeCase, setActiveCase] = useState(0)
  const current = results?.[activeCase]
  const passedCount = results?.filter(r => r.passed).length || 0
  const totalCount = results?.length || 0
  const allPassed = results && passedCount === totalCount && totalCount > 0

  return (
    <div className="flex flex-col h-full bg-bg-card">
      <div className="flex items-center gap-0 px-4 border-b border-border shrink-0">
        <button onClick={() => setTab('testcase')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'testcase' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          <CheckCircle className="h-3.5 w-3.5" /> Testcase
        </button>
        <button onClick={() => setTab('result')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            tab === 'result' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          <Terminal className="h-3.5 w-3.5" /> Test Result
          {results && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${allPassed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{passedCount}/{totalCount}</span>}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {running ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Running test cases...</span>
          </div>
        ) : tab === 'testcase' ? (
          <div className="flex flex-col h-full">
            {results && results.length > 0 ? (
              <>
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0 overflow-x-auto">
                  {results.map((r, i) => (
                    <button key={i} onClick={() => setActiveCase(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                        activeCase === i ? 'bg-bg-tertiary text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                      }`}>
                      {r.passed ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                      Case {i + 1}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {current && (
                    <>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Input:</p>
                        <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">{current.input || '(no input)'}</pre>
                      </div>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Output (Your result):</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap ${current.passed ? 'text-emerald-500' : 'text-red-500'}`}>{current.actual || '(no output)'}</pre>
                      </div>
                      <div className="rounded-lg bg-bg-tertiary/50 p-3">
                        <p className="text-[11px] text-text-tertiary font-medium mb-1">Expected:</p>
                        <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">{current.expected}</pre>
                      </div>
                      {current.description && (
                        <div className="rounded-lg bg-bg-tertiary/50 p-3">
                          <p className="text-[11px] text-text-tertiary font-medium mb-1">Description:</p>
                          <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">{current.description}</pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <p className="text-sm">You must run your code first</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {results && results.length > 0 ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {results.map((r, i) => (
                    <div key={i} className={`rounded-lg border overflow-hidden ${r.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                      <div className={`flex items-center justify-between px-3 py-2 ${r.passed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                        <div className="flex items-center gap-2">
                          {r.passed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                          <span className={`text-xs font-medium ${r.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                            Case {i + 1}: {r.passed ? 'Accepted' : 'Wrong Answer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatMs(r.executionTime)}</span>
                          <span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> {formatBytes(r.memoryUsed)}</span>
                        </div>
                      </div>
                      <div className="p-3 space-y-2 bg-bg-card">
                        <div>
                          <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Input:</p>
                          <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap bg-bg-tertiary/30 rounded p-2">{r.input || '(no input)'}</pre>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Output:</p>
                          <pre className={`text-xs font-mono whitespace-pre-wrap rounded p-2 ${r.passed ? 'text-emerald-500 bg-emerald-500/5' : 'text-red-500 bg-red-500/5'}`}>{r.actual || '(no output)'}</pre>
                        </div>
                        {!r.passed && (
                          <div>
                            <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Expected:</p>
                            <pre className="text-xs text-emerald-500 font-mono whitespace-pre-wrap bg-emerald-500/5 rounded p-2">{r.expected}</pre>
                          </div>
                        )}
                        {r.error && (
                          <div>
                            <p className="text-[10px] text-text-tertiary font-medium mb-0.5">Error:</p>
                            <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap bg-red-500/5 rounded p-2">{r.error}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center justify-between text-xs px-4 py-2.5 border-t border-border shrink-0 ${allPassed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                  <div className={`flex items-center gap-2 font-medium ${allPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                    {allPassed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {allPassed ? 'All test cases passed' : `${totalCount - passedCount} test case(s) failed`}
                  </div>
                  <span className={allPassed ? 'text-emerald-500' : 'text-text-secondary'}>
                    {passedCount}/{totalCount} passed
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                <p className="text-sm">Test results will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Workspace ─── */
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
  const [executionError, setExecutionError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const [consoleOutput, setConsoleOutput] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [leftWidth, setLeftWidth] = useState(45)
  const [bottomHeight, setBottomHeight] = useState(200)
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

  const submissions = submissionsData?.data || []
  const bookmarks = bookmarksData?.data || []
  const comments = commentsData?.data || []
  const isBookmarked = bookmarks.some(b => b.question?._id === selectedId || b.question === selectedId)
  const activeProblem = problems.find(p => p._id === selectedId) || null
  const currentIndex = filteredProblems.findIndex(p => p._id === selectedId)

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) handleSubmit(); else handleRun()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, language, activeProblem])

  // Resizable handlers
  const onVerticalDrag = useCallback((e) => {
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
    onError: (err) => setExecutionError(err?.response?.data?.message || 'Failed to run code'),
    onSettled: () => setRunning(false),
  })

  const submitMutation = useMutation({
    mutationFn: (p) => api.post('/coding/submit', p).then(r => r.data),
    onSuccess: (res) => {
      setResults(res?.data?.results || [])
      setConsoleOutput((res?.data?.results || []).map((r, i) => `Case ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`).join('\n'))
      queryClient.invalidateQueries({ queryKey: ['coding-submissions', selectedId] })
    },
    onError: (err) => setExecutionError(err?.response?.data?.message || 'Failed to submit'),
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
    setRunning(true); setResults(null); setExecutionError(null); setConsoleOutput('')
    runMutation.mutate({ code, language, questionId: activeProblem._id })
  }, [code, language, activeProblem])

  const handleSubmit = useCallback(() => {
    if (!activeProblem) return
    setSubmitting(true); setResults(null); setExecutionError(null); setConsoleOutput('')
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
    setResults(null); setElapsed(0); setTimerActive(false); setHintsUsed(0); setConsoleOutput(''); setExecutionError(null)
  }, [filteredProblems, language])

  const handleNav = useCallback((dir) => {
    const idx = filteredProblems.findIndex(p => p._id === selectedId)
    const next = idx + dir
    if (next >= 0 && next < filteredProblems.length) handleSelectProblem(filteredProblems[next]._id)
  }, [filteredProblems, selectedId, handleSelectProblem])

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
          <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {seedMutation.isPending ? 'Generating...' : 'Generate Demo Problems'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col bg-bg-card overflow-hidden">
      {/* Top Toolbar */}
      <TopToolbar
        problem={activeProblem}
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
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-56 border-r border-border bg-bg-card flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-border space-y-2">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Problems ({filteredProblems.length})</p>
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
              {filteredProblems.map((p, i) => (
                <button key={p._id} onClick={() => handleSelectProblem(p._id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors ${
                    selectedId === p._id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-bg-tertiary/50 border-l-2 border-l-transparent'
                  }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-mono text-text-tertiary mt-0.5 w-5 text-right shrink-0">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs truncate ${selectedId === p._id ? 'text-primary font-medium' : 'text-text-primary'}`}>{p.title}</p>
                      <span className={`text-[10px] capitalize ${
                        p.difficulty === 'easy' ? 'text-emerald-500' : p.difficulty === 'medium' ? 'text-amber-500' : 'text-red-500'
                      }`}>{p.difficulty}</span>
                    </div>
                  </div>
                </button>
              ))}
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
              cursorPos={cursorPos}
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
