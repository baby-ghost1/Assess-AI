import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Lightbulb, Sparkles, AlertTriangle, TrendingUp, Target, BookOpen, Brain } from 'lucide-react'

function Section({ icon: Icon, title, items, color }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2">
        <Icon className={`h-4 w-4 ${color}`} /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-text-secondary flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AIInsightsPanel({ scope, title }) {
  const [retrying, setRetrying] = useState(false)
  const endpoint = scope === 'admin' ? '/admin/analytics/insights' : '/analytics/insights'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get(endpoint).then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })

  const result = data?.data
  const insights = result?.insights
  const source = result?.source

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-heading font-semibold text-text-primary">{title || 'AI Insights'}</h3>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-1" />
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-bg-tertiary rounded w-3/4" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-4 bg-bg-tertiary rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (error || !result?.success) {
    const isAdmin = scope === 'admin' || scope === 'setter'
    return (
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-lg font-heading font-semibold text-text-primary">AI Insights</h3>
        </div>
        <p className="text-sm text-text-secondary">
          {isAdmin
            ? 'AI insights unavailable. Configure an AI provider API key in Settings to enable platform insights.'
            : 'AI insights unavailable. Your administrator needs to configure an AI provider API key.'}
        </p>
        <button onClick={async () => { setRetrying(true); await refetch(); setRetrying(false) }} disabled={retrying} className="mt-3 text-xs text-primary hover:underline disabled:opacity-50">
          {retrying ? 'Retrying...' : 'Try again'}
        </button>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-heading font-semibold text-text-primary">{title || 'AI Insights'}</h3>
        {source === 'fallback' && (
          <span className="text-[10px] bg-bg-tertiary text-text-secondary px-1.5 py-0.5 rounded">cached</span>
        )}
      </div>
      {insights.overallAssessment && (
        <p className="text-sm text-text-primary mb-4 italic border-l-2 border-primary pl-3">
          {insights.overallAssessment}
        </p>
      )}
      <div className="space-y-4">
        <Section icon={TrendingUp} title="Strengths" items={insights.strengths} color="text-success" />
        <Section icon={AlertTriangle} title="Areas to Improve" items={insights.weaknesses} color="text-warning" />
        <Section icon={Target} title="Recommendations" items={insights.recommendations} color="text-primary" />
        {insights.improvementTips && (
          <Section icon={BookOpen} title="Improvement Tips" items={insights.improvementTips} color="text-accent" />
        )}
        {insights.estimatedProficiency && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm text-text-secondary">Proficiency: </span>
            <span className="text-sm font-semibold text-text-primary capitalize">{insights.estimatedProficiency}</span>
          </div>
        )}
        {insights.focusAreas && (
          <Section icon={Target} title="Focus Areas" items={insights.focusAreas} color="text-primary" />
        )}
        {insights.easiestQuestions && (
          <Section icon={TrendingUp} title="Easiest Questions" items={insights.easiestQuestions} color="text-success" />
        )}
        {insights.hardestQuestions && (
          <Section icon={AlertTriangle} title="Hardest Questions" items={insights.hardestQuestions} color="text-danger" />
        )}
        {insights.keyMetrics && (
          <Section icon={Lightbulb} title="Key Metrics" items={insights.keyMetrics} color="text-accent" />
        )}
      </div>
    </div>
  )
}
