import { useState } from 'react'
import {
  FileText, Code, Lightbulb, CheckCircle, BookmarkCheck, Bookmark as BookmarkIcon,
  ChevronDown, ChevronUp, Users, Lock, MessageSquare, MessageCircle,
  Send, ThumbsUp, Trash2, XCircle, Clock, Cpu
} from 'lucide-react'
import { Button } from '@/components/ui'

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-500 bg-red-500/10 border-red-500/20',
}

function formatMs(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function ProblemLeft({ problem, submissions, onToggleBookmark, isBookmarked, hintsUsed, onUseHint, comments, onAddComment, onDeleteComment, onLikeComment, currentUser, activeTab, onTabChange }) {
  const [commentText, setCommentText] = useState('')
  const [seenInInterview, setSeenInInterview] = useState(null)
  const [showTopics, setShowTopics] = useState(false)
  const [showCompanies, setShowCompanies] = useState(false)

  if (!problem) return null

  const constraints = problem.codingDetails?.constraints || []
  const companies = problem.codingDetails?.companies || []
  const topics = problem.codingDetails?.topics || []
  const hints = problem.codingDetails?.hints || []
  const discussionCount = problem.codingDetails?.discussionCount || 0

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    onAddComment(commentText.trim())
    setCommentText('')
  }

  const tab = activeTab || 'description'

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-card">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border px-4 shrink-0">
        {[
          { id: 'description', icon: FileText, label: 'Description' },
          { id: 'editorial', icon: Code, label: 'Editorial' },
          { id: 'solutions', icon: Lightbulb, label: 'Solutions' },
          { id: 'submissions', icon: CheckCircle, label: 'Submissions' },
          { id: 'discussion', icon: MessageCircle, label: 'Discussion', badge: comments?.length || 0 },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => onTabChange(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
            {badge > 0 && (
              <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{badge}</span>
            )}
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
              {hints.length > 0 && (
                <button onClick={() => onUseHint(hintsUsed)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-text-secondary hover:bg-bg-tertiary transition-colors relative">
                  <Lightbulb className="h-3 w-3" /> Hint {hintsUsed > 0 && `(${hintsUsed}/${hints.length})`}
                  {hintsUsed < hints.length && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />}
                </button>
              )}
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

            {/* Revealed hints */}
            {hintsUsed > 0 && (
              <div className="space-y-2">
                {hints.slice(0, hintsUsed).map((hint, i) => (
                  <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">Hint {i + 1}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{hint}</p>
                  </div>
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

            {/* Constraints */}
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

            {/* Seen in Interview */}
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
            <button onClick={() => onTabChange('discussion')} className="flex items-center gap-2 pt-2 border-t border-border hover:text-primary transition-colors">
              <MessageSquare className="h-3.5 w-3.5 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{discussionCount + (comments?.length || 0)} discussions</span>
            </button>
          </div>
        )}

        {tab === 'editorial' && (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center space-y-2">
              <Code className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm">Editorial content coming soon</p>
              <p className="text-xs text-text-tertiary">Solutions and explanations will be available here</p>
            </div>
          </div>
        )}

        {tab === 'solutions' && (
          <div className="flex items-center justify-center h-full text-text-tertiary">
            <div className="text-center space-y-2">
              <Lightbulb className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm">Submit a solution to view yours</p>
              <p className="text-xs text-text-tertiary">Your accepted solutions will appear here</p>
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
                <div className="text-center space-y-2">
                  <CheckCircle className="h-6 w-6 mx-auto opacity-30" />
                  <p className="text-sm">No submissions yet</p>
                  <p className="text-xs text-text-tertiary">Run your code to see results here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'discussion' && (
          <div className="flex flex-col h-full">
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="rounded-lg border border-border p-3 hover:border-border/80 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">{comment.user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-text-primary">{comment.user?.name || 'Anonymous'}</span>
                          <span className="text-[10px] text-text-tertiary ml-2">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {currentUser && comment.user?._id === currentUser._id && (
                        <button onClick={() => onDeleteComment(comment._id)} className="p-1 rounded text-text-tertiary hover:text-danger transition-colors" title="Delete comment">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed pl-8">{comment.content}</p>
                    <div className="flex items-center gap-3 mt-2 pl-8">
                      <button onClick={() => onLikeComment(comment._id)}
                        className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-primary transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                        {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-text-tertiary">
                  <div className="text-center space-y-2">
                    <MessageCircle className="h-6 w-6 mx-auto opacity-30" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs text-text-tertiary">Be the first to start a discussion</p>
                  </div>
                </div>
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleSubmitComment} className="p-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Add a comment..."
                />
                <Button type="submit" disabled={!commentText.trim()} size="sm" className="h-8 px-3">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
