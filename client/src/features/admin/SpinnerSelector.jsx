import { useState } from 'react'
import { Check, Globe, Sparkles, User } from 'lucide-react'
import { useSpinnerSelection, getAllSpinners } from '@/components/shared/spinnerRegistry'
import AppLoader from '@/components/shared/AppLoader'
import { useAppSelector } from '@/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notify, apiErrorMessage } from '@/lib/notify'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const SPINNERS = getAllSpinners()

const SCOPES = [
  { id: 'mine', label: 'My loader', icon: User, desc: 'Applies to your account only' },
  { id: 'global', label: 'Global loader', icon: Globe, desc: 'Shown to logged-out visitors exploring the site' },
]

export default function SpinnerSelector() {
  const { user } = useAppSelector((s) => s.auth)
  const queryClient = useQueryClient()
  const [scopeTab, setScopeTab] = useState('mine')
  const scope = scopeTab === 'global' ? 'global' : user?._id
  const [selectedId, selectSpinner] = useSpinnerSelection(scope)
  const [previewId, setPreviewId] = useState(null)

  const saveGlobal = useMutation({
    mutationFn: (id) => api.patch('/admin/settings/global_spinner_id', { value: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public-settings'] }),
    onError: (err) => notify.error(apiErrorMessage(err), { title: 'Failed to save global loader' }),
  })

  const handleApply = (id) => {
    selectSpinner(id)
    if (scopeTab === 'global') {
      saveGlobal.mutate(id)
      notify.success('Global loader updated — website visitors will see it')
    } else {
      notify.success('Your loader updated')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">App Loader Style</h3>
          <p className="text-sm text-text-secondary">Pick your own loader, or set the global one for visitors</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setScopeTab(s.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
              scopeTab === s.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-bg-card text-text-secondary hover:border-primary/40 hover:text-text-primary'
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
        <span className="self-center text-xs text-text-tertiary">
          {SCOPES.find((s) => s.id === scopeTab)?.desc}
        </span>
      </div>

      {/* Current active */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Currently Active</span>
        </div>
        <div className="flex items-center gap-4">
          <AppLoader fullScreen={false} size={40} userId={scope} />
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
            <AppLoader fullScreen={false} size={52} spinnerId={previewId} text="Restoring your session..." />
          </div>
        </div>
      )}
    </div>
  )
}
