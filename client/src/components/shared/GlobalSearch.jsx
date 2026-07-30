import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, BarChart3, Code2, Users, Settings, Home, Brain, ArrowRight, Clock } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Question Bank', path: '/question-bank', icon: FileText },
  { label: 'Assessments', path: '/assessments', icon: BarChart3 },
  { label: 'Coding Practice', path: '/coding', icon: Code2 },
  { label: 'AI Quiz', path: '/ai-quiz', icon: Brain },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Leaderboard', path: '/leaderboard', icon: Users },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Profile', path: '/profile', icon: Users },
]

const ADMIN_ITEMS = [
  { label: 'Admin Panel', path: '/admin', icon: Settings },
  { label: 'Admin Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'User Management', path: '/admin', icon: Users },
]

export default function GlobalSearch({ open, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const items = [...NAV_ITEMS, ...ADMIN_ITEMS]
  const filtered = query
    ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : items

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selectedIndex, navigate, onClose])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex]
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary"
            placeholder="Search pages and actions..."
          />
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-bg-tertiary border border-border-light rounded">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-tertiary">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path + item.label}
                  onClick={() => { navigate(item.path); onClose() }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    i === selectedIndex ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-opacity ${i === selectedIndex ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-bg-secondary/50 text-[10px] text-text-tertiary">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-bg-tertiary border border-border-light rounded">&uarr;&darr;</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-bg-tertiary border border-border-light rounded">&crarr;</kbd> select</span>
          </div>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
