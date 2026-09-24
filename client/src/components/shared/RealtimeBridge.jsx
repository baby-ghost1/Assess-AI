import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { fetchNotifications } from '@/features/notifications/notificationSlice'
import { notify } from '@/lib/notify'

export default function RealtimeBridge() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket()
      return undefined
    }

    const s = getSocket()
    if (!s) return undefined

    const invalidatePendingAssessments = () => {
      queryClient.invalidateQueries({ queryKey: ['assessments-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pending-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-admin-pending-assessment-count'] })
      queryClient.invalidateQueries({ queryKey: ['admin-assessments'] })
    }

    const onPending = (payload) => {
      invalidatePendingAssessments()
      notify.info(payload?.title ? `New pending review: ${payload.title}` : 'New assessment submitted for review')
    }

    const onReviewDecided = (payload) => {
      queryClient.invalidateQueries({ queryKey: ['setter-assessments'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-pending-assessment-count'] })
      if (payload?.assessmentId) {
        queryClient.invalidateQueries({ queryKey: ['assessment', payload.assessmentId] })
      }
      if (payload?.status === 'published') {
        notify.success(payload?.title ? `"${payload.title}" approved` : 'Assessment approved')
      } else if (payload?.status === 'draft') {
        notify.error(payload?.rejectionReason
          ? `Assessment rejected: ${payload.rejectionReason}`
          : 'Assessment was rejected')
      }
    }

    const onQuestionPending = () => {
      queryClient.invalidateQueries({ queryKey: ['questions-approval'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-admin-question-count'] })
    }

    const onQuestionReviewed = () => {
      queryClient.invalidateQueries({ queryKey: ['questions-approval'] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['question'] })
    }

    const onNotification = () => {
      dispatch(fetchNotifications())
    }

    const onSettingsChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    }

    s.on('assessment:pending_approval', onPending)
    s.on('assessment:review-decided', onReviewDecided)
    s.on('question:pending_review', onQuestionPending)
    s.on('question:reviewed', onQuestionReviewed)
    s.on('notification:new', onNotification)
    s.on('proctoring:settings-changed', onSettingsChanged)

    return () => {
      s.off('assessment:pending_approval', onPending)
      s.off('assessment:review-decided', onReviewDecided)
      s.off('question:pending_review', onQuestionPending)
      s.off('question:reviewed', onQuestionReviewed)
      s.off('notification:new', onNotification)
      s.off('proctoring:settings-changed', onSettingsChanged)
    }
  }, [isAuthenticated, queryClient, dispatch])

  return null
}
