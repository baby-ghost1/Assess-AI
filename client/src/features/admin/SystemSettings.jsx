import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Save, Settings2, Shield, Brain, Camera, FileText } from 'lucide-react'

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

export default function SystemSettings() {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('general')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }) => api.patch(`/admin/settings/${key}`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
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

      <div className="rounded-xl border border-border bg-bg-secondary p-5">
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
    </div>
  )
}
