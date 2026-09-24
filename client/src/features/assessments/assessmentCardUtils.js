export function getQuestionCount(a) {
  return a?.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0
}

export function formatMinutes(sec) {
  if (!sec) return 'No limit'
  const m = Math.round(sec / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const STATUS_META = {
  draft: { label: 'Draft', tint: 'bg-text-tertiary/10 text-text-tertiary', bar: 'bg-text-tertiary', dot: 'bg-text-tertiary' },
  pending_approval: { label: 'Pending', tint: 'bg-warning/10 text-warning', bar: 'bg-warning', dot: 'bg-warning' },
  approved: { label: 'Approved', tint: 'bg-success/10 text-success', bar: 'bg-success', dot: 'bg-success' },
  published: { label: 'Published', tint: 'bg-success/10 text-success', bar: 'bg-success', dot: 'bg-success' },
  rejected: { label: 'Rejected', tint: 'bg-danger/10 text-danger', bar: 'bg-danger', dot: 'bg-danger' },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.draft
}

export function candidateState({ a, attemptInfo, user }) {
  const isHiring = a.accessMode === 'restricted'
  const isOwn = !isHiring && user?._id && a.createdBy?._id === user._id
  const status = attemptInfo?.status
  const inProgress = status === 'in_progress' || status === 'paused'
  const completed = status === 'completed'
  const unlimited = isOwn || attemptInfo?.isUnlimited
  const fallbackRemaining = (a.maxAttempts ?? 1) - (attemptInfo?.attemptCount || 0)
  const remaining = attemptInfo?.remainingAttempts !== undefined ? attemptInfo.remainingAttempts : fallbackRemaining
  const canRetake = !attemptInfo || unlimited || Number(remaining) > 0
  const exhausted = !inProgress && !completed && !canRetake
  return { isHiring, isOwn, inProgress, completed, unlimited, remaining, canRetake, exhausted, status }
}