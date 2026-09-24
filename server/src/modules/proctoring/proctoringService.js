import ProctoringViolation from './ProctoringViolation.js'
import Attempt from '../assessments/Attempt.js'
import { createNotification } from '../notifications/notificationService.js'
import { getProctoringSettings } from '../settings/settingsService.js'

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
  face_not_centered: { maxCount: 5, action: 'warning' },
  low_lighting: { maxCount: 5, action: 'warning' },
  face_outside_screen: { maxCount: 5, action: 'warning' },
  posture_violation: { maxCount: 5, action: 'warning' },
  camera_denied: { maxCount: 3, action: 'warning' },
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
  face_not_centered: 'medium',
  low_lighting: 'low',
  face_outside_screen: 'medium',
  posture_violation: 'medium',
  camera_denied: 'high',
}

// Map violation types → admin sub-toggle keys in getProctoringSettings()
const TYPE_SETTING_KEY = {
  no_face: 'faceDetection',
  face_outside_screen: 'faceDetection',
  face_not_centered: 'faceDetection',
  multiple_faces: 'faceDetection',
  phone_detected: 'faceDetection',
  low_lighting: 'faceDetection',
  looking_away: 'gazeDetection',
  posture_violation: 'postureDetection',
  clipboard_usage: 'clipboardDetection',
  copy_paste: 'clipboardDetection',
  right_click: 'rightClickDetection',
  network_disconnect: 'networkMonitoring',
  // tab_switch, fullscreen_exit, keyboard_shortcut, background_noise:
  // no dedicated admin sub-toggle → always active when proctoring enabled
}

const TYPE_LABELS = {
  tab_switch: 'Tab Switch',
  multiple_faces: 'Multiple Faces',
  no_face: 'No Face Detected',
  phone_detected: 'Phone Detected',
  looking_away: 'Looking Away',
  background_noise: 'Background Noise',
  clipboard_usage: 'Clipboard Usage',
  keyboard_shortcut: 'Keyboard Shortcut',
  network_disconnect: 'Network Disconnect',
  fullscreen_exit: 'Fullscreen Exit',
  copy_paste: 'Copy Paste',
  right_click: 'Right Click',
  face_not_centered: 'Face Not Centered',
  low_lighting: 'Low Lighting',
  face_outside_screen: 'Face Outside Screen',
  posture_violation: 'Posture Violation',
  camera_denied: 'Camera Denied',
}

export async function logViolation({ attemptId, userId, assessmentId, type, details, screenshot, metadata }) {
  // Server-authoritative: read live admin settings on every violation
  const settings = await getProctoringSettings()
  if (!settings.enabled) {
    return { dropped: true, violation: null, action: 'none', shouldAutoSubmit: false, totalCount: 0, typeCount: 0 }
  }

  const settingKey = TYPE_SETTING_KEY[type]
  if (settingKey && settings[settingKey] === false) {
    return { dropped: true, violation: null, action: 'none', shouldAutoSubmit: false, totalCount: 0, typeCount: 0 }
  }

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
    const maxCount = type === 'tab_switch' ? settings.tabSwitchLimit : limits.maxCount
    if (typeCount >= maxCount || totalCount >= 10) {
      action = limits.action
      if (limits.action === 'auto_submit') {
        if (settings.autoSubmit) {
          shouldAutoSubmit = true
        } else {
          action = 'warning'
        }
      }
    }
  }

  await Attempt.findByIdAndUpdate(attemptId, { $inc: { violationCount: 1 } })

  const label = TYPE_LABELS[type] || type

  if (action === 'warning' || shouldAutoSubmit) {
    await createNotification(userId, {
      type: 'account_update',
      title: `Proctoring Warning: ${label}`,
      message: shouldAutoSubmit
        ? `Auto-submitted due to excessive ${label.toLowerCase()} violations (${totalCount} total).`
        : `A ${label.toLowerCase()} violation was detected. ${typeCount} of this type recorded. Please follow assessment guidelines.`,
    })
  }

  return { dropped: false, violation, action, shouldAutoSubmit, totalCount, typeCount }
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
    .populate('attempt', 'attemptNumber status violationCount percentage')
    .sort({ timestamp: -1 })
}
