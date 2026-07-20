import ProctoringViolation from './ProctoringViolation.js'
import Attempt from '../assessments/Attempt.js'
import Assessment from '../assessments/Assessment.js'
import { createNotification } from '../notifications/notificationService.js'

const VIOLATION_LIMITS = {
  tab_switch: { maxCount: 3, action: 'warning' },
  multiple_faces: { maxCount: 2, action: 'warning' },
  no_face: { maxCount: 5, action: 'warning' },
  phone_detected: { maxCount: 2, action: 'warning' },
  looking_away: { maxCount: 10, action: 'warning' },
  background_noise: { maxCount: 5, action: 'warning' },
  clipboard_usage: { maxCount: 1, action: 'auto_submit' },
  keyboard_shortcut: { maxCount: 2, action: 'warning' },
  network_disconnect: { maxCount: 3, action: 'warning' },
  fullscreen_exit: { maxCount: 2, action: 'auto_submit' },
  copy_paste: { maxCount: 1, action: 'auto_submit' },
  right_click: { maxCount: 3, action: 'warning' },
}

const SEVERITY_MAP = {
  tab_switch: 'medium',
  multiple_faces: 'high',
  no_face: 'high',
  phone_detected: 'high',
  looking_away: 'low',
  background_noise: 'medium',
  clipboard_usage: 'high',
  keyboard_shortcut: 'high',
  network_disconnect: 'medium',
  fullscreen_exit: 'high',
  copy_paste: 'high',
  right_click: 'medium',
}

export async function logViolation({ attemptId, userId, assessmentId, type, details, screenshot, metadata }) {
  const severity = SEVERITY_MAP[type] || 'medium'

  const violation = await ProctoringViolation.create({
    attempt: attemptId,
    user: userId,
    assessment: assessmentId,
    type,
    severity,
    details: details || '',
    screenshot: screenshot || null,
    metadata: metadata || {},
  })

  const totalCount = await ProctoringViolation.countDocuments({ attempt: attemptId })
  const typeCount = await ProctoringViolation.countDocuments({ attempt: attemptId, type })

  const limits = VIOLATION_LIMITS[type]
  let action = 'none'
  let shouldAutoSubmit = false

  if (limits) {
    if (typeCount >= limits.maxCount || totalCount >= 10) {
      action = limits.action
      if (limits.action === 'auto_submit') {
        shouldAutoSubmit = true
      }
    }
  }

  await Attempt.findByIdAndUpdate(attemptId, { $inc: { violationCount: 1 } })

  const typeLabels = { tab_switch: 'Tab Switch', multiple_faces: 'Multiple Faces', no_face: 'No Face Detected', phone_detected: 'Phone Detected', looking_away: 'Looking Away', audio_violation: 'Audio Violation' }
  const label = typeLabels[type] || type

  if (action === 'warning' || shouldAutoSubmit) {
    await createNotification(userId, {
      type: 'account_update',
      title: `Proctoring Warning: ${label}`,
      message: shouldAutoSubmit
        ? `Auto-submitted due to excessive ${label.toLowerCase()} violations (${totalCount} total).`
        : `A ${label.toLowerCase()} violation was detected. ${typeCount} of this type recorded. Please follow assessment guidelines.`,
    })
  }

  return { violation, action, shouldAutoSubmit, totalCount, typeCount }
}

export async function getViolations(attemptId) {
  return ProctoringViolation.find({ attempt: attemptId }).sort({ timestamp: -1 })
}

export async function getViolationsByUser(userId, limit = 50) {
  return ProctoringViolation.find({ user: userId })
    .populate('attempt assessment', 'title')
    .sort({ timestamp: -1 })
    .limit(limit)
}

export async function getViolationsByAssessment(assessmentId) {
  return ProctoringViolation.find({ assessment: assessmentId })
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
}
