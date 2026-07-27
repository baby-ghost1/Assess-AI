import { useState } from 'react'
import { Trophy, Medal, Award, Users, Code2, AlertTriangle, Crown, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/hooks'
import api from '@/lib/api'

const TABS = [
  { id: 'assessments', label: 'Assessments', icon: Trophy },
  { id: 'coding', label: 'Coding', icon: Code2 },
]

function PodiumCard({ entry, rank, suffix = '%' }) {
  const medals = { 1: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', ring: 'ring-yellow-400/30', label: 'Gold' }, 2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10', ring: 'ring-gray-300/30', label: 'Silver' }, 3: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10', ring: 'ring-amber-600/30', label: 'Bronze' } }
  const m = medals[rank]
  const Icon = m.icon

  return (
    <div className={`flex flex-col items-center rounded-xl border border-border bg-bg-card p-5 hover:shadow-lg transition-shadow duration-200 ring-2 ${m.ring}`}>
      <div className={`rounded-full p-3 ${m.bg} mb-3`}>
        <Icon className={`h-7 w-7 ${m.color}`} />
      </div>
      <p className="text-sm font-semibold text-text-primary text-center truncate w-full">{entry.name}</p>
      <p className="text-2xl font-heading font-bold text-text-primary mt-1">{entry.score}{suffix}</p>
      <p className="text-xs text-text-secondary mt-0.5">{entry.detail}</p>
    </div>
  )
}

function RankCard({ rank, entry, isCurrentUser, suffix = '%' }) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border bg-bg-card p-4 transition-all duration-200 hover:shadow-md ${isCurrentUser ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border'}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
        rank === 1 ? 'bg-yellow-400/15 text-yellow-400' :
        rank === 2 ? 'bg-gray-300/15 text-gray-300' :
        rank === 3 ? 'bg-amber-600/15 text-amber-600' :
        'bg-bg-tertiary text-text-secondary'
      }`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">{entry.name}</p>
          {isCurrentUser && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">You</span>}
        </div>
        <p className="text-xs text-text-secondary">{entry.detail}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-heading font-bold text-text-primary">{entry.score}{suffix}</p>
        <p className="text-xs text-text-secondary">{entry.sub}</p>
      </div>
    </div>
  )
}

function SkeletonLeaderboard() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-5 animate-pulse">
            <div className="flex justify-center mb-3"><div className="h-12 w-12 rounded-full bg-bg-tertiary" /></div>
            <div className="h-3 bg-bg-tertiary rounded w-20 mx-auto mb-2" />
            <div className="h-6 bg-bg-tertiary rounded w-14 mx-auto" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 animate-pulse">
          <div className="h-9 w-9 rounded-lg bg-bg-tertiary" />
          <div className="flex-1 space-y-2"><div className="h-3 bg-bg-tertiary rounded w-24" /><div className="h-2 bg-bg-tertiary rounded w-16" /></div>
          <div className="text-right space-y-2"><div className="h-5 bg-bg-tertiary rounded w-12 ml-auto" /><div className="h-2 bg-bg-tertiary rounded w-10 ml-auto" /></div>
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState('assessments')
  const { user } = useAppSelector((s) => s.auth)

  const { data: assessmentData, isLoading: assessmentLoading, error: assessmentError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/analytics/leaderboard').then((r) => r.data),
    retry: false,
  })

  const { data: codingData, isLoading: codingLoading, error: codingError } = useQuery({
    queryKey: ['coding-leaderboard'],
    queryFn: () => api.get('/coding/leaderboard').then((r) => r.data),
    retry: false,
    enabled: tab === 'coding',
  })

  const isLoading = tab === 'assessments' ? assessmentLoading : codingLoading
  const error = tab === 'assessments' ? assessmentError : codingError

  const assessmentEntries = (assessmentData?.data || []).map((e) => ({
    id: e._id,
    name: e.name || e.email || 'Anonymous',
    score: e.avgScore || 0,
    detail: e.email || '',
    sub: `${e.totalAssessments || 0} assessments`,
  }))

  const codingEntries = (codingData?.data || []).map((e) => ({
    id: e.user?._id || e._id,
    name: e.user?.name || e.user?.email || 'Anonymous',
    score: e.totalSolved || 0,
    detail: e.user?.email || '',
    sub: `${e.totalSubmissions || 0} submissions`,
  }))

  const entries = tab === 'assessments' ? assessmentEntries : codingEntries
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  const currentUserId = user?._id

  const isCount = tab === 'coding'

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Gradient Header */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-xl bg-warning/10 p-3"><Trophy className="h-6 w-6 text-warning" /></div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">Leaderboard</h2>
            <p className="text-sm text-text-secondary mt-1">Top performers across the platform</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex rounded-full border border-border bg-bg-card p-1">
        {TABS.map((t) => {
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 z-10 ${
                isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary shadow-sm" />
              )}
              <span className="relative flex items-center gap-2">
                <t.icon className="h-4 w-4" />
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonLeaderboard />
      ) : error ? (
        <div className="rounded-xl border border-border bg-bg-card p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-danger mx-auto mb-3" />
          <p className="text-text-primary font-medium">Failed to load leaderboard</p>
          <p className="text-sm text-text-secondary mt-1">{error?.message || 'Something went wrong'}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <Users className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-40" />
          <p className="text-text-primary font-medium">No data yet</p>
          <p className="text-sm text-text-secondary mt-1">
            {tab === 'assessments' ? 'Complete an assessment to appear here' : 'Solve coding problems to appear here'}
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {podium.length > 0 && (
            <div className={`grid gap-4 ${podium.length >= 3 ? 'grid-cols-3' : podium.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
              {podium.map((e, i) => (
                <PodiumCard key={e.id || i} entry={e} rank={i + 1} suffix={isCount ? '' : '%'} />
              ))}
            </div>
          )}

          {/* Rest of entries */}
          {rest.length > 0 && (
            <div className="space-y-3">
              {rest.map((e, i) => (
                <RankCard
                  key={e.id || i}
                  rank={i + 4}
                  entry={e}
                  isCurrentUser={e.id === currentUserId}
                  suffix={isCount ? '' : '%'}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
