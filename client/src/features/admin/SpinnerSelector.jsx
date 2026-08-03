import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useSpinnerSelection, getAllSpinners } from '@/components/shared/spinnerRegistry'
import AppLoader from '@/components/shared/AppLoader'
import { useAppSelector } from '@/hooks'
import { toast } from 'sonner'

const SPINNERS = getAllSpinners()

export default function SpinnerSelector() {
  const { user } = useAppSelector((s) => s.auth)
  const [selectedId, selectSpinner] = useSpinnerSelection(user?._id)
  const [previewId, setPreviewId] = useState(null)

  const handleApply = (id) => {
    selectSpinner(id)
    toast.success('Loader updated! Refresh to see changes across the app.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">App Loader Style</h3>
          <p className="text-sm text-text-secondary">Choose the loading animation shown across the app</p>
        </div>
      </div>

      {/* Current active */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Currently Active</span>
        </div>
        <div className="flex items-center gap-4">
          <AppLoader fullScreen={false} size={40} userId={user?._id} />
          <span className="text-sm text-text-secondary">
            {SPINNERS.find((s) => s.id === selectedId)?.name}
          </span>
        </div>
      </div>

      {/* Grid of all spinners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SPINNERS.map((spinner) => {
          const isActive = spinner.id === selectedId
          const isPreview = spinner.id === previewId

          return (
            <button
              key={spinner.id}
              onClick={() => setPreviewId(isPreview ? null : spinner.id)}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : isPreview
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-bg-card hover:border-border/60'
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <div className="h-14 flex items-center justify-center">
                {spinner.render(44)}
              </div>

              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                {spinner.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Preview panel */}
      {previewId && (
        <div className="p-6 rounded-xl border border-border bg-bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{SPINNERS.find((s) => s.id === previewId)?.name}</h4>
              <p className="text-xs text-text-secondary mt-0.5">{SPINNERS.find((s) => s.id === previewId)?.desc}</p>
            </div>
            <button
              onClick={() => handleApply(previewId)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                previewId === selectedId
                  ? 'bg-primary/20 text-primary cursor-default'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
              }`}
            >
              {previewId === selectedId ? 'Active' : 'Apply'}
            </button>
          </div>

          <div className="flex items-center justify-center py-8 rounded-lg bg-bg-primary border border-border/50">
            <div className="flex flex-col items-center gap-4">
              {SPINNERS.find((s) => s.id === previewId)?.render(52)}
              <p className="text-xs text-text-secondary">Preview with text</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-4 rounded-lg bg-bg-primary border border-border/50">
            <AppLoader fullScreen={false} size={40} userId={user?._id} />
          </div>
        </div>
      )}
    </div>
  )
}
