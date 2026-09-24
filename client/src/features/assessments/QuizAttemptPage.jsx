import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { Loader2, Bookmark, BookmarkCheck, BookOpen, ChevronLeft, ChevronRight, Flag, Send, Eraser, AlertTriangle, X, AlertCircle, CheckCircle, Lock, Mail } from 'lucide-react'
import useProctoring from '@/features/proctoring/useProctoring'
import ProctoringOverlay from '@/features/proctoring/ProctoringOverlay'

export default function QuizAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navAssessment = location.state?.assessment
  const [attempt, setAttempt] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentQ, setCurrentQ] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [timeLeft, setTimeLeft] = useState(null)
  const [deadline, setDeadline] = useState(null)
  const timerRef = useRef(null)
  const questionTimerRef = useRef(0)
  const startingRef = useRef(false)
  const [starting, setStarting] = useState(false)
  const [timerType, setTimerType] = useState('overall')
  const [perQuestionTime, setPerQuestionTime] = useState(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [attemptError, setAttemptError] = useState(null)
  const [showPalette, setShowPalette] = useState(false)
  const [submittedScreen, setSubmittedScreen] = useState(false)
  const [restrictedEmail, setRestrictedEmail] = useState('')
  const [restrictedPassword, setRestrictedPassword] = useState('')
  const [proctoringSettings, setProctoringSettings] = useState(null)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const finishRef = useRef(() => {})

  const { data: attemptData, isLoading, error: queryError } = useQuery({
    queryKey: ['attempt', id],
    queryFn: () => api.get(`/assessments/attempt/active/${id}`).then((r) => r.data),
    enabled: Boolean(id) && !attempt && !starting,
  })

  useEffect(() => {
    if (attemptData?.data) {
      const a = attemptData.data.attempt
      setAttempt(a)
      setTimeLeft(a.timeRemaining)
      setDeadline(a.deadline || (a.startedAt && a.timeLimit ? new Date(a.startedAt).getTime() + a.timeLimit * 1000 : null))
      const config = a.assessment?.aiQuizConfig || {}
      setTimerType(config.timerType || 'overall')
      setPerQuestionTime(config.perQuestionTime || null)
      const subs = attemptData.data.submissions || []
      setSubmissions(subs)
      if (subs.length > 0) {
        setCurrentQ(subs[0])
        setCurrentIdx(0)
        if (config.timerType === 'per_question' && config.perQuestionTime) {
          setTimeLeft(config.perQuestionTime)
        }
      }
    }
  }, [attemptData])

  // Per-question time tracker
  useEffect(() => {
    questionTimerRef.current = 0
    const interval = setInterval(() => {
      questionTimerRef.current += 1
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIdx])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && attempt?.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        // Overall timer ticks from the server-authoritative deadline so a reload,
        // clock skew or a throttled background tab can't desync the countdown.
        if (timerType === 'overall' && deadline) {
          const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000))
          setTimeLeft(remaining)
          if (remaining <= 0) {
            clearInterval(timerRef.current)
            finishRef.current('timeout')
          }
          return
        }
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            if (timerType === 'per_question') {
              if (currentIdx < submissions.length - 1) {
                handleNavigateRef.current(currentIdx + 1)
              } else {
                setShowSubmitDialog(true)
              }
              return perQuestionTime || 0
            }
            finishRef.current('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [timeLeft, attempt?.status, timerType, currentIdx, submissions.length, perQuestionTime, deadline])

  const assessmentData = attempt?.assessment || attemptData?.data?.attempt?.assessment

  const { data: assessmentDetailData } = useQuery({
    queryKey: ['assessment-detail', id],
    queryFn: () => api.get(`/assessments/${id}`).then((r) => r.data),
    enabled: Boolean(id) && !attempt && !starting,
  })
  const assessmentDetail = assessmentDetailData?.data
  const isRestricted = (assessmentDetail?.accessMode === 'restricted') || (navAssessment?.accessMode === 'restricted')

  // Fetch full proctoring settings (sub-toggles, tab limit, auto-submit)
  const { data: proctoringStatusData } = useQuery({
    queryKey: ['proctoring-status'],
    queryFn: () => api.get('/assessments/proctoring/status').then((r) => r.data),
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (proctoringStatusData?.data) {
      setProctoringSettings(proctoringStatusData.data)
    }
  }, [proctoringStatusData])

  // Listen for real-time proctoring setting / per-assessment proctoring changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const settingsSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    settingsSocket.on('proctoring:settings-changed', (data) => {
      setProctoringSettings(data)
    })

    settingsSocket.on('assessment:proctoring-changed', (data) => {
      setAttempt((prev) => (prev ? {
        ...prev,
        assessment: { ...prev.assessment, proctoringRequired: data.proctoringRequired },
      } : prev))
    })

    return () => { settingsSocket.disconnect() }
  }, [])

  const proctoringEnabled = assessmentData?.proctoringRequired && proctoringSettings?.enabled !== false && attempt?.status === 'in_progress'

  const attemptId = attempt?._id

  const { status: proctorStatus, lastViolation, videoRef, violationsRef, streamRef, isFullscreen, enterFullscreen } = useProctoring({
    attemptId,
    enabled: proctoringEnabled,
    settings: proctoringSettings,
    onAutoSubmit: () => { finishRef.current('auto_submit') },
    onViolation: (v) => {
      if (v.type === 'tab_switch') setTabSwitchCount((c) => c + 1)
    },
  })

  const navigateMut = useMutation({
    mutationFn: ({ idx }) => api.post(`/assessments/attempt/${attemptId}/navigate/${idx}`),
    onSuccess: (res) => {
      const data = res.data.data
      setCurrentIdx(data.attempt.currentQuestionIndex)
      setCurrentQ(data.currentSubmission)
      if (timerType === 'per_question' && perQuestionTime) {
        setTimeLeft(perQuestionTime)
      }
    },
    onError: (err) => {
      setAttemptError(err?.response?.data?.message || 'Failed to navigate')
    },
  })

  const submitMut = useMutation({
    mutationFn: (data) => api.post(`/assessments/attempt/${attemptId}/answer`, data),
    onError: (err) => {
      setAttemptError(err?.response?.data?.message || 'Failed to save answer')
    },
  })

  const finishMut = useMutation({
    mutationFn: (reason = 'manual') => api.post(`/assessments/attempt/${attemptId}/finish`, { reason }),
    onSuccess: (res) => {
      clearInterval(timerRef.current)
      setShowSubmitDialog(false)
      const finishedStatus = res?.data?.data?.status || 'completed'
      setAttempt((prev) => (prev ? { ...prev, status: finishedStatus } : prev))
      const showImmediately = assessmentData?.accessMode !== 'restricted' && assessmentData?.showResultImmediately !== false
      if (showImmediately) {
        navigate(`/results/${attemptId}`)
      } else {
        setSubmittedScreen(true)
      }
    },
    onError: (err) => {
      setAttemptError(err?.response?.data?.message || 'Failed to submit')
    },
  })

  finishRef.current = (reason = 'manual') => {
    if (attempt && !finishMut.isPending) finishMut.mutate(reason)
  }

  const startAttempt = useCallback(async () => {
    if (startingRef.current) return
    startingRef.current = true
    setStarting(true)
    setAttemptError(null)
    try {
      const res = await api.post('/assessments/attempt/start', { assessmentId: id })
      const data = res.data.data
      setAttempt(data)
      setTimeLeft(data.timeRemaining ?? data.timeLimit)
      setDeadline(data.deadline || (data.startedAt && data.timeLimit ? new Date(data.startedAt).getTime() + data.timeLimit * 1000 : null))
      setCurrentIdx(0)
      const config = data.assessment?.aiQuizConfig || {}
      setTimerType(config.timerType || 'overall')
      setPerQuestionTime(config.perQuestionTime || null)
      const subRes = await api.get(`/assessments/attempt/${data._id}`)
      const subs = subRes.data.data.submissions
      setSubmissions(subs)
      if (subs?.length > 0) setCurrentQ(subs[0])
    } catch (err) {
      setAttemptError(err?.response?.data?.message || 'Failed to start attempt')
    } finally {
      setStarting(false)
      startingRef.current = false
    }
  }, [id])

  const startRestrictedAttempt = useCallback(async (e) => {
    e.preventDefault()
    if (startingRef.current) return
    startingRef.current = true
    setStarting(true)
    setAttemptError(null)
    try {
      const res = await api.post('/assessments/attempt/restricted-start', {
        assessmentId: id,
        candidateEmail: restrictedEmail,
        password: restrictedPassword,
      })
      const result = res.data.data
      const data = result.attempt || result
      setAttempt(data)
      setTimeLeft(data.timeRemaining ?? data.timeLimit)
      setDeadline(data.deadline || (data.startedAt && data.timeLimit ? new Date(data.startedAt).getTime() + data.timeLimit * 1000 : null))
      setCurrentIdx(0)
      const config = data.assessment?.aiQuizConfig || {}
      setTimerType(config.timerType || 'overall')
      setPerQuestionTime(config.perQuestionTime || null)
      const subRes = await api.get(`/assessments/attempt/${data._id}`)
      const subs = subRes.data.data.submissions
      setSubmissions(subs)
      if (subs?.length > 0) setCurrentQ(subs[0])
    } catch (err) {
      setAttemptError(err?.response?.data?.message || 'Failed to start attempt')
    } finally {
      setStarting(false)
      startingRef.current = false
    }
  }, [id, restrictedEmail, restrictedPassword])

  const textSaveTimerRef = useRef(null)
  const pendingTextSaveRef = useRef(null)

  const flushPendingAnswer = () => {
    if (textSaveTimerRef.current) {
      clearTimeout(textSaveTimerRef.current)
      textSaveTimerRef.current = null
    }
    if (pendingTextSaveRef.current) {
      const p = pendingTextSaveRef.current
      pendingTextSaveRef.current = null
      submitMut.mutate({ questionId: p.qId, answer: p.answer, timeSpent: p.timeSpent })
    }
  }

  useEffect(() => () => {
    if (textSaveTimerRef.current) clearTimeout(textSaveTimerRef.current)
  }, [])

  const handleNavigate = useCallback((idx) => {
    flushPendingAnswer()
    if (attempt && idx >= 0 && idx < submissions.length) {
      navigateMut.mutate({ idx })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, submissions.length, navigateMut, submitMut])

  const handleNavigateRef = useRef(handleNavigate)
  handleNavigateRef.current = handleNavigate

  const updateSubmission = (qId, updates) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.question?._id === qId ? { ...s, ...updates } : s))
    )
  }

  const handleAnswer = (answer) => {
    if (!currentQ) return
    const qId = currentQ.question?._id
    const isAnswered = answer !== null && answer !== undefined && answer !== ''

    // Options save immediately; free-text is debounced to avoid keystroke races
    if (typeof answer === 'string') {
      pendingTextSaveRef.current = { qId, answer, timeSpent: questionTimerRef.current }
      if (textSaveTimerRef.current) clearTimeout(textSaveTimerRef.current)
      textSaveTimerRef.current = setTimeout(() => {
        const p = pendingTextSaveRef.current
        pendingTextSaveRef.current = null
        textSaveTimerRef.current = null
        if (p) submitMut.mutate({ questionId: p.qId, answer: p.answer, timeSpent: p.timeSpent })
      }, 600)
    } else {
      if (textSaveTimerRef.current) {
        clearTimeout(textSaveTimerRef.current)
        textSaveTimerRef.current = null
      }
      if (pendingTextSaveRef.current) {
        const p = pendingTextSaveRef.current
        pendingTextSaveRef.current = null
        submitMut.mutate({ questionId: p.qId, answer: p.answer, timeSpent: p.timeSpent })
      }
      submitMut.mutate({ questionId: qId, answer, timeSpent: questionTimerRef.current })
    }

    updateSubmission(qId, { answer, isAnswered })
    setCurrentQ({ ...currentQ, answer, isAnswered })
    questionTimerRef.current = 0
  }

  const clearAnswer = () => {
    handleAnswer(null)
  }

  const toggleBookmark = () => {
    if (!currentQ) return
    const qId = currentQ.question?._id
    const newVal = !currentQ.isBookmarked
    submitMut.mutate({ questionId: qId, answer: currentQ.answer, isBookmarked: newVal, timeSpent: 0 })
    updateSubmission(qId, { isBookmarked: newVal })
    setCurrentQ({ ...currentQ, isBookmarked: newVal })
  }

  const handleFinish = (reason = 'manual') => {
    flushPendingAnswer()
    finishRef.current(reason)
  }

  const formatTime = (s) => {
    if (!s && s !== 0) return '--:--'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Error state for query
  if (queryError) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-danger mx-auto" />
        <h2 className="text-xl font-heading font-bold text-text-primary">Failed to Load Assessment</h2>
        <p className="text-sm text-text-secondary">{queryError?.response?.data?.message || 'Something went wrong. Please try again.'}</p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          <ChevronLeft className="h-4 w-4" /> Back to Assessments
        </Button>
      </div>
    )
  }

  if (submittedScreen) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Test Submitted Successfully</h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Your responses have been recorded. Thank you for completing this assessment.
          The results will be communicated to you separately.
        </p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          Back to Assessments
        </Button>
      </div>
    )
  }

  if (!attempt && !starting) {
    if (isRestricted) {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-6">
          {attemptError && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger shrink-0" />
              <p className="text-sm text-danger">{attemptError}</p>
            </div>
          )}
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-primary">This assessment requires authentication</h2>
          <p className="text-text-secondary text-sm">Enter your registered email and the shared password to start.</p>
          <form onSubmit={startRestrictedAttempt} className="space-y-4 text-left max-w-sm mx-auto">
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input type="email" required value={restrictedEmail} onChange={(e) => setRestrictedEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input type="password" required value={restrictedPassword} onChange={(e) => setRestrictedPassword(e.target.value)}
                  placeholder="Shared password"
                  className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={starting || !restrictedEmail || !restrictedPassword}>
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              {starting ? 'Verifying...' : 'Start Assessment'}
            </Button>
          </form>
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        {attemptError && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3 max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{attemptError}</p>
          </div>
        )}
        <BookOpen className="h-16 w-16 text-primary mx-auto" />
        <h2 className="text-2xl font-heading font-bold text-text-primary">Ready to begin?</h2>
        <p className="text-text-secondary text-sm">Make sure you have a stable internet connection. The timer will start once you click below.</p>
        <Button size="lg" onClick={startAttempt} disabled={starting}>
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
          Start Attempt
        </Button>
      </div>
    )
  }

  if (isLoading || !currentQ) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const subs = submissions
  const answeredCount = subs.filter((s) => s.isAnswered).length
  const bookmarkCount = subs.filter((s) => s.isBookmarked).length
  const question = currentQ.question

  return (
    <div className={`flex ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)]'} -m-6`}>
      <ProctoringOverlay status={proctorStatus} lastViolation={lastViolation} videoRef={videoRef} violations={violationsRef} streamRef={streamRef} isFullscreen={isFullscreen} enterFullscreen={enterFullscreen} settings={proctoringSettings} tabSwitchCount={tabSwitchCount} />

      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Submit Quiz?
              </h3>
              <button onClick={() => setShowSubmitDialog(false)} className="text-text-secondary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <p>You have <span className="font-semibold text-text-primary">{formatTime(timeLeft)}</span> remaining.</p>
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-success"></span> Answered ({answeredCount})</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-bg-tertiary"></span> Unanswered ({subs.length - answeredCount})</div>
              </div>
              {subs.length - answeredCount > 0 && (
                <p className="text-warning font-medium">{subs.length - answeredCount} question{subs.length - answeredCount > 1 ? 's are' : ' is'} still unanswered.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => {
                setShowSubmitDialog(false)
                const firstUnanswered = subs.findIndex((s) => !s.isAnswered)
                if (firstUnanswered !== -1) handleNavigate(firstUnanswered)
              }}>
                Review Answers
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleFinish('manual')} disabled={finishMut.isPending}>
                {finishMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPalette && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPalette(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[320px] max-w-[85vw] bg-bg-secondary border-l border-border shadow-2xl flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h4 className="text-sm font-semibold text-text-primary">Question Palette</h4>
                <button onClick={() => setShowPalette(false)} className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-tertiary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {subs.map((s, i) => (
                    <button key={i} onClick={() => { handleNavigate(i); setShowPalette(false) }}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors relative ${
                        i === currentIdx ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-secondary z-10' : ''
                      } ${
                        s.isAnswered ? 'bg-success text-white'
                        : s.isBookmarked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
                      }`}
                      title={`Question ${i + 1}${s.isAnswered ? ' - Answered' : s.isBookmarked ? ' - Bookmarked' : ' - Unanswered'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-success"></span> Answered</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-bg-tertiary"></span> Unanswered</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-500/40 border border-amber-500/50"></span> Bookmarked</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm ring-2 ring-primary"></span> Current</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-border bg-bg-card px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => currentIdx > 0 && handleNavigate(currentIdx - 1)} disabled={currentIdx === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-sm font-medium text-text-primary">Question {currentIdx + 1} of {subs.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary hidden lg:inline">{answeredCount}/{subs.length} answered</span>
            <button
              onClick={() => setShowPalette(true)}
              className="lg:hidden flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors"
            >
              {answeredCount}/{subs.length} answered
            </button>
            <span className={`text-lg font-mono font-bold ${timeLeft < (timerType === 'per_question' ? 10 : 60) ? 'text-danger' : 'text-text-primary'}`}>{formatTime(timeLeft)}</span>
            <Button variant="danger" size="sm" onClick={() => setShowSubmitDialog(true)}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </div>
        </div>

        {attemptError && (
          <div className="mx-6 mt-3 rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger shrink-0" />
            <p className="text-xs text-danger">{attemptError}</p>
            <button onClick={() => setAttemptError(null)} className="ml-auto text-danger hover:text-danger/80"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded">{question?.questionType?.replace('_', ' ')}</span>
                  <span className="text-xs text-text-tertiary">{question?.marks} mark{question?.marks > 1 ? 's' : ''}</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-primary">{question?.title}</h3>
              </div>
              <button onClick={toggleBookmark} className={`p-2 rounded-lg transition-colors ${currentQ.isBookmarked ? 'text-amber-400 bg-amber-500/10' : 'text-text-tertiary hover:bg-bg-tertiary'}`}>
                {currentQ.isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </button>
            </div>

            {question?.options?.length > 0 && (
              <div className="space-y-3">
                {question.options.map((opt) => {
                  const isSelected = currentQ.answer === opt.key
                  const isMulti = question.questionType === 'multi_correct'
                  const selected = isMulti ? (Array.isArray(currentQ.answer) && currentQ.answer.includes(opt.key)) : isSelected
                  return (
                    <button key={opt.key} onClick={() => {
                      if (isMulti) {
                        const arr = currentQ.answer || []
                        const next = arr.includes(opt.key) ? arr.filter((k) => k !== opt.key) : [...arr, opt.key]
                        handleAnswer(next)
                      } else {
                        handleAnswer(opt.key)
                      }
                    }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        selected ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-bg-secondary text-text-primary hover:border-text-tertiary'
                      }`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                        selected ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary'
                      }`}>{opt.key}</div>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {question?.questionType === 'fill_blanks' && (
              <input value={currentQ.answer || ''} onChange={(e) => handleAnswer(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Type your answer..." />
            )}

            {question?.questionType === 'subjective' && (
              <textarea value={currentQ.answer || ''} onChange={(e) => handleAnswer(e.target.value)} rows={6}
                className="w-full rounded-lg border border-border bg-bg-secondary py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Write your answer..." />
            )}

            {currentQ.isAnswered && (
              <div className="flex justify-center">
                <button onClick={clearAnswer} className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm text-text-secondary hover:text-danger hover:border-danger/30 transition-colors">
                  <Eraser className="h-4 w-4" /> Clear Answer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-bg-card px-6 py-3 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={currentIdx === 0} onClick={() => handleNavigate(currentIdx - 1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-tertiary mr-2">Bookmarked: {bookmarkCount}</span>
          </div>
          <Button variant="secondary" size="sm" disabled={currentIdx === subs.length - 1} onClick={() => handleNavigate(currentIdx + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-64 border-l border-border bg-bg-secondary p-4 overflow-y-auto hidden lg:block">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Questions</h4>
          <span className="text-xs text-text-secondary">{answeredCount}/{subs.length}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {subs.map((s, i) => (
            <button key={i} onClick={() => handleNavigate(i)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors relative ${
                i === currentIdx ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-secondary z-10' : ''
              } ${
                s.isAnswered ? 'bg-success text-white' 
                : s.isBookmarked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
              title={`Question ${i + 1}${s.isAnswered ? ' - Answered' : s.isBookmarked ? ' - Bookmarked' : ' - Unanswered'}`}>
              {i + 1}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 text-xs text-text-secondary">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-success"></span> Answered</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-bg-tertiary"></span> Unanswered</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-amber-500/40 border border-amber-500/50"></span> Bookmarked</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm ring-2 ring-primary"></span> Current</div>
        </div>
      </div>
    </div>
  )
}
