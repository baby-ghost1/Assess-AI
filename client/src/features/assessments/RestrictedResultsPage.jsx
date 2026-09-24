import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { notify } from '@/lib/notify'
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Minus, AlertTriangle, Loader2, Send, RotateCw } from 'lucide-react'

export default function RestrictedResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['restricted-results', id],
    queryFn: () => api.get(`/assessments/${id}/restricted-results`).then((r) => r.data),
    enabled: Boolean(id),
  })

  const releaseMut = useMutation({
    mutationFn: () => api.post(`/assessments/${id}/release-results`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restricted-results', id] })
      notify.success('Results released to candidates')
    },
    onError: (err) => notify.error(err?.response?.data?.message || 'Failed to release results'),
  })

  const grantMut = useMutation({
    mutationFn: (userId) => api.post(`/assessments/${id}/retake-grants`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restricted-results', id] })
      notify.success('Retake granted')
    },
    onError: (err) => notify.error(err?.response?.data?.message || 'Failed to grant retake'),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (error || !data?.data) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-danger mx-auto" />
        <h2 className="text-xl font-heading font-bold text-text-primary">Failed to Load Results</h2>
        <p className="text-sm text-text-secondary">{error?.response?.data?.message || 'Something went wrong'}</p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>Back to Assessments</Button>
      </div>
    )
  }

  const { assessment, candidates, totalCandidates } = data.data

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-bg-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative">
          <button onClick={() => navigate('/assessments')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-text-primary">{assessment.title}</h1>
              <p className="text-sm text-text-secondary mt-1">Restricted Assessment Results</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-center">
                <div className="px-4 py-2 rounded-xl bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{totalCandidates}</p>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Candidates</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-bg-secondary">
                  <p className="text-2xl font-bold text-text-primary">{assessment.passingPercentage}%</p>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Pass %</p>
                </div>
              </div>
              <Button
                variant={assessment.resultsReleased ? 'secondary' : 'primary'}
                disabled={assessment.resultsReleased || releaseMut.isPending}
                onClick={() => releaseMut.mutate()}
              >
                {releaseMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {assessment.resultsReleased ? 'Results Released' : 'Release Results'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!assessment.resultsReleased && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">Results are currently hidden from candidates</p>
            <p className="text-text-secondary text-xs mt-0.5">Candidates will only see their scores once you release the results.</p>
          </div>
        </div>
      )}

      {/* Candidate Results */}
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-card p-12 text-center">
          <Users className="h-12 w-12 text-text-tertiary/30 mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No candidates have attempted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div key={candidate.email} className="rounded-xl border border-border bg-bg-card overflow-hidden">
              {/* Candidate Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(candidate.name || candidate.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{candidate.name || 'N/A'}</p>
                    <p className="text-xs text-text-tertiary">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{candidate.totalAttempts}</p>
                    <p className="text-[10px] text-text-tertiary uppercase">Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${candidate.passed ? 'text-success' : 'text-danger'}`}>{candidate.bestPercentage}%</p>
                    <p className="text-[10px] text-text-tertiary uppercase">Best</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${candidate.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {candidate.passed ? 'Passed' : 'Failed'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5"
                    disabled={grantMut.isPending || !candidate.attempts[0]?.userId}
                    onClick={() => grantMut.mutate(candidate.attempts[0].userId)}
                    title="Grant one additional attempt"
                  >
                    {grantMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                    Grant Retake{candidate.grantCount > 0 ? ` (${candidate.grantCount})` : ''}
                  </Button>
                </div>
              </div>

              {/* Attempt Details */}
              <div className="px-6 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      <th className="text-left py-2 font-medium">Attempt</th>
                      <th className="text-left py-2 font-medium">Score</th>
                      <th className="text-center py-2 font-medium">Correct</th>
                      <th className="text-center py-2 font-medium">Wrong</th>
                      <th className="text-center py-2 font-medium">Skipped</th>
                      <th className="text-center py-2 font-medium">Time</th>
                      <th className="text-center py-2 font-medium">Violations</th>
                      <th className="text-center py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidate.attempts.map((attempt, ai) => (
                      <tr key={attempt.attemptId} className="border-t border-border/30 hover:bg-bg-secondary/30 transition-colors">
                        <td className="py-2.5 text-text-tertiary">#{attempt.attemptNumber || ai + 1}</td>
                        <td className="py-2.5">
                          <span className="font-semibold text-text-primary">{attempt.score}/{attempt.totalMarks}</span>
                          <span className="text-text-tertiary ml-1.5">({attempt.percentage}%)</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle className="h-3 w-3" /> {attempt.correctCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-danger">
                            <XCircle className="h-3 w-3" /> {attempt.incorrectCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-text-tertiary">
                            <Minus className="h-3 w-3" /> {attempt.unansweredCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-text-secondary">
                            <Clock className="h-3 w-3" /> {attempt.totalTimeSpent ? `${Math.round(attempt.totalTimeSpent / 60)}m` : '--'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          {attempt.violationCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <AlertTriangle className="h-3 w-3" /> {attempt.violationCount}
                            </span>
                          ) : (
                            <span className="text-text-tertiary/50">0</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            attempt.status === 'completed' ? 'bg-success/10 text-success' :
                            attempt.status === 'auto_submitted' ? 'bg-orange-500/10 text-orange-400' :
                            attempt.status === 'timed_out' ? 'bg-danger/10 text-danger' :
                            attempt.status === 'in_progress' ? 'bg-warning/10 text-warning' :
                            'bg-bg-tertiary text-text-tertiary'
                          }`}>
                            {attempt.status === 'auto_submitted' ? 'auto-submitted' :
                             attempt.status === 'timed_out' ? 'timed out' :
                             attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
