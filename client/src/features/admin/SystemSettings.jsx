import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Save, Settings2, Shield, Brain, Camera, FileText, Trash2, AlertTriangle, X } from 'lucide-react'
import { notify } from '@/lib/notify'

const CATEGORY_ICONS = { general: Settings2, security: Shield, assessment: FileText, ai: Brain, proctoring: Camera }
const CATEGORY_LABELS = { general: 'General', security: 'Security', assessment: 'Assessment', ai: 'AI', proctoring: 'Proctoring' }

function SettingRow({ setting, onUpdate }) {
  const [value, setValue] = useState(setting.value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(setting.key, value)
    } finally {
      setSaving(false)
    }
  }

  const isBool = typeof setting.value === 'boolean'

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary capitalize">{setting.key.replace(/_/g, ' ')}</p>
        {setting.description && <p className="text-xs text-text-secondary mt-0.5">{setting.description}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {isBool ? (
          <button
            onClick={() => {
              setValue(!value)
              onUpdate(setting.key, !value)
            }}
            className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-bg-tertiary'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
          </button>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 rounded border border-border bg-bg-primary px-2 py-1 text-sm text-text-primary text-right focus:border-primary focus:outline-none"
            type={typeof value === 'number' ? 'number' : 'text'}
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving || value === setting.value}
          className="rounded-lg p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function ResetModal({ onClose, onConfirm, isPending }) {
  const [confirmation, setConfirmation] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-card shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-text-primary">Delete All Data</h2>
            <p className="text-sm text-text-secondary">This cannot be undone</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-bg-tertiary text-text-secondary"><X className="h-5 w-5" /></button>
        </div>

        <div className="rounded-lg border border-error/30 bg-error/5 p-3 mb-4">
          <p className="text-sm text-text-primary font-medium">This will permanently delete:</p>
          <ul className="mt-2 text-sm text-text-secondary space-y-1">
            <li>All users (except your admin account)</li>
            <li>All assessments</li>
            <li>All questions</li>
            <li>All coding submissions & progress</li>
            <li>All attempts & submissions</li>
            <li>All notifications, tags, settings</li>
          </ul>
        </div>

        <label className="block text-sm font-medium text-text-primary mb-2">
          Type <span className="font-mono bg-error/10 text-error px-1.5 py-0.5 rounded">DELETE ALL DATA</span> to confirm:
        </label>
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-error focus:outline-none mb-4"
          placeholder="DELETE ALL DATA"
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary rounded-lg">Cancel</button>
          <button
            onClick={() => onConfirm(confirmation)}
            disabled={isPending || confirmation !== 'DELETE ALL DATA'}
            className="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-lg disabled:opacity-40 inline-flex items-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SystemSettings() {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('general')
  const [showResetModal, setShowResetModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }) => api.patch(`/admin/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      notify.success('Settings saved')
    },
  })

  const resetMutation = useMutation({
    mutationFn: (confirmation) => api.post('/admin/delete-all', { confirmation }),
    onSuccess: () => {
      setShowResetModal(false)
      notify.success('All data deleted successfully')
    },
    onError: (err) => notify.error(err.response?.data?.message || 'Failed to delete data'),
  })

  const settings = data?.data || []
  const categories = [...new Set(settings.map((s) => s.category))]
  const filteredSettings = settings.filter((s) => s.category === activeCategory)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Settings2
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <Icon className="h-4 w-4" /> {CATEGORY_LABELS[cat] || cat}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-2 capitalize">
          {CATEGORY_LABELS[activeCategory] || activeCategory} Settings
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          {filteredSettings.length} setting{filteredSettings.length !== 1 ? 's' : ''}
        </p>
        {filteredSettings.map((s) => (
          <SettingRow
            key={s.key}
            setting={s}
            onUpdate={(key, value) => updateMutation.mutate({ key, value })}
          />
        ))}
      </div>

      <div className="rounded-xl border border-error/30 bg-error/5 p-5 mt-6">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-error" /> Danger Zone
        </h3>
        <p className="text-sm text-text-secondary mb-4">Irreversible actions that permanently delete data</p>
        <button
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-lg inline-flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete All Data
        </button>
      </div>

      {showResetModal && (
        <ResetModal
          onClose={() => setShowResetModal(false)}
          onConfirm={(confirmation) => resetMutation.mutate(confirmation)}
          isPending={resetMutation.isPending}
        />
      )}
    </div>
  )
}
