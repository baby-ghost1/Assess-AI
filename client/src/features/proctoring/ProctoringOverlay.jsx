import { useState, useEffect } from 'react'
import { Shield, ShieldOff, AlertTriangle, Video, VideoOff, Camera, Maximize } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProctoringOverlay({ status, lastViolation, videoRef, violations, streamRef, isFullscreen, enterFullscreen, settings, tabSwitchCount }) {
  const [showCamera, setShowCamera] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const cameraAvailable = status !== 'no-camera' && Boolean(streamRef?.current)
  const tabLimit = Number(settings?.tabSwitchLimit) > 0 ? Number(settings?.tabSwitchLimit) : 3

  const statusConfig = {
    active: { icon: Shield, color: 'text-success', label: 'Proctoring Active' },
    inactive: { icon: ShieldOff, color: 'text-text-tertiary', label: 'Proctoring Off' },
    disconnected: { icon: ShieldOff, color: 'text-warning', label: 'Reconnecting...' },
    'no-camera': { icon: ShieldOff, color: 'text-danger', label: 'Camera Required' },
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
    face_not_centered: 'Face Not Centered',
    low_lighting: 'Low Lighting',
    face_outside_screen: 'Face Outside Screen',
    posture_violation: 'Posture Violation',
    camera_denied: 'Camera Denied',
  }

  const s = statusConfig[status] || statusConfig.inactive
  const Icon = s.icon
  const violationCount = violations?.current?.length || 0
  const violationList = [...(violations?.current || [])].reverse().slice(0, 10)

  // Attach live stream when preview is toggled on (covers late-mounting video element)
  useEffect(() => {
    if (showCamera && videoRef?.current && streamRef?.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [showCamera, videoRef, streamRef])

  return (
    <>
      {/* Top-center cluster — sits in header's empty middle zone, never covers timer/submit/nav */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-2 max-w-[min(92vw,640px)]">
        <AnimatePresence>
          {lastViolation && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs text-danger max-w-[240px]"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{lastViolation.details || lastViolation.type.replace('_', ' ')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'active' && !isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="flex items-center gap-1.5 rounded-lg bg-warning/15 border border-warning/40 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/25 transition-colors"
          >
            <Maximize className="h-3.5 w-3.5" />
            Enter Fullscreen
          </button>
        )}

        <div className={`flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 ${s.color}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
          {violationCount > 0 && (
            <button
              onClick={() => setShowLog(!showLog)}
              title="View violations"
              className="ml-1 rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger font-bold hover:bg-danger/20 transition-colors cursor-pointer"
            >
              {violationCount}
            </button>
          )}
        </div>

        {typeof tabSwitchCount === 'number' && tabSwitchCount > 0 && (
          <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            tabSwitchCount >= tabLimit
              ? 'border-danger/40 bg-danger/10 text-danger'
              : 'border-warning/40 bg-warning/10 text-warning'
          }`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Tabs: {tabSwitchCount}/{tabLimit}
          </div>
        )}

        <button
          onClick={() => setShowCamera(!showCamera)}
          disabled={!cameraAvailable}
          className="flex items-center gap-2 rounded-lg bg-bg-card border border-border px-3 py-1.5 text-xs font-medium hover:bg-bg-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {showCamera ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          Camera
        </button>

        {/* Violations history — latest first, max 10 */}
        {showLog && violationCount > 0 && (
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-72 max-h-52 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-2xl p-2 space-y-1 z-[60]">
            <p className="px-1 pb-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
              Violations ({violationCount})
            </p>
            {violationList.map((v, i) => (
              <div key={`${v.timestamp}-${i}`} className="flex items-start gap-2 rounded-md px-1.5 py-1 hover:bg-bg-tertiary">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-danger" />
                <div className="min-w-0">
                  <p className="text-xs text-text-primary truncate">
                    {violationLabels[v.type] || v.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {new Date(v.timestamp).toLocaleTimeString()}
                    {v.details ? ` · ${v.details}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera preview — bottom-right over empty lower sidebar area on desktop;
          pointer-events-none + semi-transparent so it never blocks quiz interaction/content */}
      {showCamera && cameraAvailable && (
        <div className="fixed bottom-4 right-4 z-50 w-40 h-28 rounded-xl overflow-hidden border-2 border-border shadow-xl bg-black pointer-events-none opacity-75 hover:opacity-100 transition-opacity">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5">
            <Camera className="h-2.5 w-2.5 text-success" />
            <span className="text-[9px] text-white font-medium">Live</span>
          </div>
        </div>
      )}
    </>
  )
}