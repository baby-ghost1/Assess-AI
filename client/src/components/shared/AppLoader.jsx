import { getStoredSpinnerId, getSpinnerById, useGlobalSpinnerId, GLOBAL_SPINNER_SCOPE } from './spinnerRegistry'
import { useAppSelector } from '@/hooks'

function resolveScope(userId) {
  if (userId) return userId
  try {
    if (localStorage.getItem('accessToken')) {
      return localStorage.getItem('assessai_active_uid') || null
    }
  } catch { /* noop */ }
  return null
}

export default function AppLoader({ text, fullScreen = true, size, userId, spinnerId }) {
  const storeUserId = useAppSelector((s) => s.auth.user?._id)
  const globalSpinnerId = useGlobalSpinnerId()

  const scope = resolveScope(userId ?? storeUserId)
  const spinner = getSpinnerById(
    spinnerId || getStoredSpinnerId(scope) || globalSpinnerId || getStoredSpinnerId(GLOBAL_SPINNER_SCOPE)
  )

  const content = (
    <div className="flex flex-col items-center gap-4">
      {spinner.render(size)}
      {text && <p className="text-sm font-medium loader-shimmer-text">{text}</p>}
    </div>
  )

  if (!fullScreen) return content

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary transition-[left] duration-300 md:left-[var(--sidebar-width,0px)]">
      {content}
    </div>
  )
}
