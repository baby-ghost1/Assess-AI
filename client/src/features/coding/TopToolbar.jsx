import { Play, Pause, CheckCircle, Timer, PanelLeftClose, PanelLeft, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function TopToolbar({ elapsed, timerActive, onToggleTimer, onRun, onSubmit, running, submitting, sidebarOpen, onToggleSidebar, currentIndex, totalCount, onPrev, onNext, commentCount, onOpenDiscussion }) {
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
        <Button onClick={onRun} disabled={running || submitting} variant="outline" size="sm" className="h-7 px-3 text-xs">
          <Play className="h-3 w-3" /> Run
        </Button>
        <Button onClick={onSubmit} disabled={submitting || running} size="sm" className="h-7 px-3 text-xs">
          <CheckCircle className="h-3 w-3" /> Submit
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-text-secondary">
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono font-medium tabular-nums">{formatTime(elapsed)}</span>
          <button onClick={onToggleTimer} className="p-0.5 rounded border border-border hover:bg-bg-tertiary transition-colors" title={timerActive ? 'Pause' : 'Start'}>
            {timerActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>
        <button onClick={onOpenDiscussion} className="relative p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
          <MessageCircle className="h-4 w-4" />
          {commentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 text-[9px] font-bold bg-danger text-white rounded-full flex items-center justify-center px-0.5">
              {commentCount > 99 ? '99+' : commentCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
