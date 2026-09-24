import Settings from './Settings.js'

// Single source of truth for platform setting defaults.
// adminService seeds the DB from this list; all readers fall back to it.
export const DEFAULT_SETTINGS = [
  { key: 'site_name', value: 'AssessAI', description: 'Platform name', category: 'general' },
  { key: 'site_description', value: 'AI-Powered Assessment Platform', description: 'Platform description', category: 'general' },
  { key: 'default_assessment_time', value: 30, description: 'Default assessment time in minutes', category: 'assessment' },
  { key: 'passing_percentage', value: 40, description: 'Default passing percentage', category: 'assessment' },
  { key: 'max_attempts_per_assessment', value: 3, description: 'Maximum allowed attempts per assessment', category: 'assessment' },
  { key: 'enable_proctoring', value: true, description: 'Enable AI proctoring by default', category: 'proctoring' },
  { key: 'proctoring_face_detection', value: true, description: 'Enable webcam face detection', category: 'proctoring' },
  { key: 'proctoring_gaze_detection', value: true, description: 'Enable gaze/looking-away detection', category: 'proctoring' },
  { key: 'proctoring_posture_detection', value: false, description: 'Enable posture/slouch detection', category: 'proctoring' },
  { key: 'proctoring_tab_switch_limit', value: 3, description: 'Tab switch violations before warning', category: 'proctoring' },
  { key: 'proctoring_auto_submit', value: true, description: 'Auto-submit assessment on critical violation', category: 'proctoring' },
  { key: 'proctoring_clipboard_detection', value: true, description: 'Enable clipboard copy/paste monitoring', category: 'proctoring' },
  { key: 'proctoring_right_click_detection', value: true, description: 'Enable right-click detection', category: 'proctoring' },
  { key: 'proctoring_network_monitoring', value: true, description: 'Enable network disconnect detection', category: 'proctoring' },
  { key: 'ai_provider', value: 'groq', description: 'Default AI provider for generation', category: 'ai' },
  { key: 'enable_registration', value: true, description: 'Allow new user registration', category: 'security' },
]

const defaultsByKey = new Map(DEFAULT_SETTINGS.map((s) => [s.key, s.value]))

export function getDefaultSetting(key) {
  return defaultsByKey.get(key)
}

export async function getSettingValue(key) {
  try {
    const setting = await Settings.findOne({ key }).lean()
    if (setting) return setting.value
  } catch {
    // fall through to coded default
  }
  return defaultsByKey.get(key)
}

export async function getSettingValues(keys) {
  try {
    const rows = await Settings.find({ key: { $in: keys } }).lean()
    const found = new Map(rows.map((r) => [r.key, r.value]))
    const out = {}
    for (const key of keys) {
      out[key] = found.has(key) ? found.get(key) : defaultsByKey.get(key)
    }
    return out
  } catch {
    const out = {}
    for (const key of keys) out[key] = defaultsByKey.get(key)
    return out
  }
}

// Normalized proctoring settings consumed by candidates (status endpoint + socket broadcast)
// and by server-side enforcement (logViolation).
export async function getProctoringSettings() {
  const v = await getSettingValues([
    'enable_proctoring',
    'proctoring_face_detection',
    'proctoring_gaze_detection',
    'proctoring_posture_detection',
    'proctoring_clipboard_detection',
    'proctoring_right_click_detection',
    'proctoring_network_monitoring',
    'proctoring_tab_switch_limit',
    'proctoring_auto_submit',
  ])
  return {
    enabled: v.enable_proctoring !== false,
    faceDetection: v.proctoring_face_detection !== false,
    gazeDetection: v.proctoring_gaze_detection !== false,
    postureDetection: v.proctoring_posture_detection === true,
    clipboardDetection: v.proctoring_clipboard_detection !== false,
    rightClickDetection: v.proctoring_right_click_detection !== false,
    networkMonitoring: v.proctoring_network_monitoring !== false,
    tabSwitchLimit: Number(v.proctoring_tab_switch_limit) > 0 ? Number(v.proctoring_tab_switch_limit) : 3,
    autoSubmit: v.proctoring_auto_submit !== false,
  }
}

export async function getAssessmentDefaults() {
  const v = await getSettingValues([
    'default_assessment_time',
    'passing_percentage',
    'max_attempts_per_assessment',
  ])
  const minutes = Number(v.default_assessment_time)
  const passing = Number(v.passing_percentage)
  const maxAttempts = Number(v.max_attempts_per_assessment)
  return {
    timeLimit: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
    passingPercentage: Number.isFinite(passing) && passing >= 0 && passing <= 100 ? passing : 40,
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? Math.round(maxAttempts) : 1,
  }
}
