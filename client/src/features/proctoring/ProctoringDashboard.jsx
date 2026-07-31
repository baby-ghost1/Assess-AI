import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Shield, AlertTriangle, Search } from 'lucide-react'
import { TableSkeleton } from '@/components/shared'

const severityColors = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-red-500/10 text-red-400',
}

const violationLabels = {
  tab_switch: 'Tab Switch',
  multiple_faces: 'Multiple Faces',
  no_face: 'No Face',
  phone_detected: 'Phone Detected',
  looking_away: 'Looking Away',
  background_noise: 'Background Noise',
  clipboard_usage: 'Clipboard Usage',
  keyboard_shortcut: 'Keyboard Shortcut',
  network_disconnect: 'Network Disconnect',
  fullscreen_exit: 'Fullscreen Exit',
  copy_paste: 'Copy/Paste',
  right_click: 'Right Click',
}

export default function ProctoringDashboard() {
  const [search, setSearch] = useState('')

  const { data: violationsData, isLoading } = useQuery({
    queryKey: ['violations-admin'],
    queryFn: () => api.get('/proctoring/violations/my').then((r) => r.data),
  })

  const violations = violationsData?.data || []
  const filtered = search
    ? violations.filter((v) => v.type?.includes(search) || v.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : violations

  const counts = {}
  violations.forEach((v) => {
    counts[v.type] = (counts[v.type] || 0) + 1
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Proctoring Dashboard</h2>
        <p className="mt-1 text-sm text-text-secondary">Monitor candidate violations and proctoring activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(violationLabels).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">{label}</span>
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            </div>
            <p className="text-xl font-bold text-text-primary">{counts[key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search violations..." />
      </div>

      {isLoading ? <TableSkeleton rows={8} /> : (
        <div className="rounded-xl border border-border bg-bg-card divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-sm text-text-secondary">No violations recorded</p>
            </div>
          ) : filtered.map((v) => (
            <div key={v._id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${severityColors[v.severity] || 'bg-bg-tertiary'}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{violationLabels[v.type] || v.type}</p>
                  <p className="text-xs text-text-secondary">
                    {v.user?.name || 'Unknown'} &middot; {v.details || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                <span className={`px-2 py-0.5 rounded font-medium ${severityColors[v.severity]}`}>{v.severity}</span>
                <span>{new Date(v.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
