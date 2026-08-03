import { getSelectedSpinnerId, getSpinnerById } from './spinnerRegistry'

export default function AppLoader({ text, fullScreen = true, size, userId }) {
  const spinner = getSpinnerById(getSelectedSpinnerId(userId))

  const content = (
    <div className="flex flex-col items-center gap-4">
      {spinner.render(size)}
      {text && <p className="text-sm font-medium loader-shimmer-text">{text}</p>}
    </div>
  )

  if (!fullScreen) return content

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary">
      {content}
    </div>
  )
}
