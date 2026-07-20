import { Trophy, Medal, Award, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'

function RankCard({ rank, name, score, assessments, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-secondary p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-xs text-text-secondary">{assessments} assessments</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-heading font-bold text-text-primary">{score}%</p>
        <p className="text-xs text-text-secondary">avg score</p>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/analytics/leaderboard').then((r) => r.data),
    retry: false,
  })

  const entries = data?.data || []

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-warning/10 p-3"><Trophy className="h-6 w-6 text-warning" /></div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">Leaderboard</h2>
          <p className="text-sm text-text-secondary mt-1">Top performers across all assessments</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-12 text-center">
          <Users className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No leaderboard data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <RankCard
              key={e._id || i}
              rank={i + 1}
              name={e.name || e.email || 'Anonymous'}
              score={e.avgScore || 0}
              assessments={e.totalAssessments || 0}
              icon={i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : Users}
              color={i === 0 ? 'bg-warning' : i === 1 ? 'bg-text-secondary' : i === 2 ? 'bg-amber-700' : 'bg-bg-tertiary'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
