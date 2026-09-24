import React from 'react'
import { Brain, Code2, Layers, Clock, FileText, Target, Users, CheckCircle, XCircle, Eye, Edit, Send, Trash2, RotateCw, Loader2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui'
import { getQuestionCount, formatMinutes, statusMeta, candidateState } from './assessmentCardUtils'

const TYPE_CHIP = (t) => (
  {
    coding: { Icon: Code2, chip: 'bg-pink-500/10 text-pink-400', key: 'CODING' },
    mixed: { Icon: Layers, chip: 'bg-purple-500/10 text-purple-400', key: 'MIXED' },
  }[t] || { Icon: Brain, chip: 'bg-primary/10 text-primary', key: 'QUIZ' }
)

const NEUTRAL_TYPE_CHIP = (t) => {
  const base = { coding: Code2, mixed: Layers }[t] || Brain
  const key = { coding: 'CODING', mixed: 'MIXED' }[t] || 'QUIZ'
  return { Icon: base, chip: 'bg-bg-tertiary text-text-secondary', key }
}

function DenseButton({ icon: Icon, tone = 'secondary', children, ...props }) {
  const tones = {
    secondary: '!bg-bg-elevated text-text-secondary hover:text-text-primary',
    success: '!bg-success/10 text-success hover:bg-success/20',
    danger: '!bg-danger/10 text-danger hover:bg-danger/20',
    primary: '!bg-primary text-white hover:bg-primary-dark',
    primarySoft: '!bg-primary/10 text-primary hover:bg-primary/20',
    warningSoft: '!bg-warning/10 text-warning hover:bg-warning/20',
  }
  return (
    <Button size="sm" variant="ghost" className={`${tones[tone]}`} {...props}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </Button>
  )
}

const Stat = ({ icon: Icon, label, value, accent = 'text-text-primary' }) => (
  <div className="flex items-center gap-1.5 rounded-md bg-bg-secondary/60 px-2 py-1">
    <Icon className="h-3 w-3 text-text-tertiary" />
    <span className={`text-[11px] font-semibold ${accent}`}>{value}</span>
    <span className="ml-auto text-[8px] uppercase tracking-wider text-text-tertiary">{label}</span>
  </div>
)

export default function DenseAssessmentCard({ a, role = 'candidate', onAction, onReject, navigate, attemptInfo, user }) {
  const meta = statusMeta(a.status)
  const useNeutralChip = role === 'candidate' || role === 'setter'
  const surfaceCls = useNeutralChip
    ? 'bg-bg-elevated border-border shadow-sm shadow-black/[0.04] hover:shadow-md hover:shadow-black/[0.06]'
    : 'bg-bg-card'
  const { Icon, chip, key: typeKey } = useNeutralChip ? NEUTRAL_TYPE_CHIP(a.assessmentType) : TYPE_CHIP(a.assessmentType)
  const isRestricted = a.accessMode === 'restricted'
  const isRejected = a.status === 'draft' && a.rejectionReason
  const cs = candidateState({ a, attemptInfo, user })
  const qCount = getQuestionCount(a)
  const reject = () => (onReject ? onReject(a._id) : onAction('reject', a._id))

  const goToAttempt = () => navigate(`/assessments/${a._id}`, { state: { assessment: { accessMode: a.accessMode, title: a.title } } })
  const candActions = []
  if (cs.inProgress) {
    candActions.push(
      <DenseButton key="resume" icon={RotateCw} tone="primarySoft" onClick={goToAttempt}>Resume Assessment</DenseButton>
    )
  } else if (cs.completed) {
    candActions.push(
      <DenseButton key="results" icon={Eye} tone="success" onClick={() => navigate(`/results/${attemptInfo?._id}`)}>View Results</DenseButton>
    )
    if (cs.canRetake) {
      candActions.push(
        <DenseButton key="retake" icon={RotateCw} tone="primarySoft" onClick={goToAttempt}>Retake Assessment</DenseButton>
      )
    }
  } else if (cs.exhausted) {
    candActions.push(
      <DenseButton key="exhausted" icon={XCircle} disabled>Max Attempts Reached</DenseButton>
    )
  } else {
    candActions.push(
      <DenseButton key="retake" icon={RotateCw} tone="primarySoft" onClick={goToAttempt}>Retake Assessment</DenseButton>
    )
  }

  const actions = []
  if (role === 'admin') {
    if (a.status === 'pending_approval') {
      actions.push(<DenseButton key="r" icon={Eye} tone="primary" onClick={() => onAction('review', a._id)}>Review</DenseButton>)
      actions.push(<DenseButton key="a" icon={CheckCircle} tone="success" onClick={() => onAction('approve', a._id)}>Approve</DenseButton>)
      actions.push(<DenseButton key="j" icon={XCircle} tone="danger" onClick={reject}>Reject</DenseButton>)
    } else if (a.status === 'published') {
      actions.push(<DenseButton key="v" icon={Eye} onClick={() => onAction('view', a._id)}>View</DenseButton>)
      if (isRestricted) actions.push(<DenseButton key="res" icon={Users} onClick={() => onAction('results', a._id)}>Results</DenseButton>)
      actions.push(<DenseButton key="d" icon={Trash2} tone="danger" onClick={() => onAction('delete', a._id)}>Delete</DenseButton>)
    } else {
      actions.push(<DenseButton key="v" icon={Eye} onClick={() => onAction('view', a._id)}>View</DenseButton>)
      actions.push(<DenseButton key="d" icon={Trash2} tone="danger" onClick={() => onAction('delete', a._id)}>Delete</DenseButton>)
    }
  } else if (role === 'setter') {
    if (a.status === 'draft' && !isRejected) {
      actions.push(<DenseButton key="v" icon={Eye} tone="secondary" onClick={() => onAction('view', a._id)}>View</DenseButton>)
      actions.push(<DenseButton key="e" icon={Edit} tone="warningSoft" onClick={() => onAction('edit', a._id)}>Edit</DenseButton>)
      actions.push(<DenseButton key="s" icon={Send} tone="primarySoft" disabled={qCount === 0} onClick={() => onAction('submit-approval', a._id)}>Submit</DenseButton>)
    } else if (a.status === 'pending_approval') {
      actions.push(<DenseButton key="p" icon={Loader2} disabled>Awaiting</DenseButton>)
    } else if (a.status === 'published') {
      actions.push(<DenseButton key="o" icon={Eye} tone="primarySoft" onClick={() => onAction('attempt', a._id)}>Open</DenseButton>)
    }
  }
  const used = attemptInfo?.attemptCount || 0
  const limit = a.maxAttempts ?? 1
  const effLimit = attemptInfo && attemptInfo.remainingAttempts !== undefined ? used + Number(attemptInfo.remainingAttempts) : limit
  const pct = Math.min(100, Math.round((used / Math.max(1, effLimit)) * 100))

  return (
    <div className={`group relative flex min-h-[190px] flex-col rounded-xl border transition-all duration-200 hover:border-primary/30 ${surfaceCls}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded ${chip}`}>
            <Icon className="h-3 w-3" />
          </div>
          <span className="truncate text-[9px] font-bold uppercase tracking-widest text-text-tertiary">{typeKey}</span>
          <span className="text-text-tertiary">·</span>
          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-text-secondary">{a.difficulty}</span>
          {isRestricted && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400">
              <Users className="h-2 w-2" /> Hiring
            </span>
          )}
          {role === 'candidate' && cs.isOwn && (
            <span className="rounded bg-bg-tertiary px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-text-secondary">Self</span>
          )}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.tint}`}>
          <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 py-2">
        <h3 className="truncate text-[13px] font-semibold leading-tight text-text-primary group-hover:text-primary">{a.title}</h3>
        {a.description && <p className="mt-0.5 text-[11px] leading-snug text-text-secondary line-clamp-1">{a.description}</p>}

        {role === 'candidate' && attemptInfo && !cs.unlimited && (
          <div className="mt-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <div className="h-full rounded-full bg-text-tertiary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-0.5 text-[9px] text-text-tertiary">{used} of {effLimit} attempts used</p>
          </div>
        )}

        <div className="mt-1.5 grid grid-cols-3 gap-1">
          <Stat icon={Clock} label="Time" value={formatMinutes(a.timeLimit)} />
          <Stat icon={FileText} label="Ques" value={qCount} />
          <Stat icon={Target} label="Pass" value={`${a.passingPercentage}%`} />
        </div>

        {isRejected && (
          <p className="mt-1.5 truncate rounded border border-danger/20 bg-danger/5 px-1.5 py-0.5 text-[9px] text-danger">Rejected: {a.rejectionReason}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
          {(role === 'admin' || role === 'setter') && a.createdBy && (
            <span className="mr-auto flex min-w-0 items-center gap-1 text-[9px] text-text-tertiary">
              <Calendar className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{a.createdBy.name}</span>
            </span>
          )}
          {role === 'candidate' ? (
            <>
              <span className="mr-auto min-w-0 truncate text-[9px] text-text-tertiary">
                {cs.unlimited ? 'Unlimited attempts' : attemptInfo ? `${used} of ${effLimit} used` : `${limit} attempt(s)`}
              </span>
              <span className="ml-1 flex shrink-0 items-center gap-1.5">
                {candActions.map((el, i) => React.cloneElement(el, { key: i }))}
              </span>
            </>
          ) : (
            actions.length > 0 && actions.map((el, i) => React.cloneElement(el, { key: i }))
          )}
        </div>
      </div>
    </div>
  )
}