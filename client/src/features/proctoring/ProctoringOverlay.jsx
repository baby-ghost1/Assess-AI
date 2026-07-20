import { useState } from 'react'
import { Shield, ShieldOff, AlertTriangle, Video, VideoOff, Camera, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProctoringOverlay({ status, lastViolation, videoRef, violations }) {
  const [showCamera, setShowCamera] = useState(false)

  const statusConfig = {
    active: { icon: Shield, color: 'text-success', label: 'Proctoring Active' },
    inactive: { icon: ShieldOff, color: 'text-text-tertiary', label: 'Proctoring Off' },
    disconnected: { icon: ShieldOff, color: 'text-warning', label: 'Reconnecting...' },
    'no-camera': { icon: ShieldOff, color: 'text-danger', label: 'Camera Required' },
  }

  const s = statusConfig[status] || statusConfig.inactive
  const Icon = s.icon
  const violationCount = violations?.current?.length || 0

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <AnimatePresence>
          {lastViolation && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs text-danger"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {lastViolation.details || lastViolation.type.replace('_', ' ')}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowCamera(!showCamera)}
          className="flex items-center gap-2 rounded-lg bg-bg-card border border-border px-3 py-1.5 text-xs font-medium hover:bg-bg-tertiary transition-colors"
        >
          {showCamera ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          Camera
        </button>

        <div className={`flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 ${s.color}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{s.label}</span>
          {violationCount > 0 && (
            <span className="ml-1 rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger font-bold">{violationCount}</span>
          )}
        </div>
      </div>

      {showCamera && (
        <div className="fixed bottom-4 right-4 z-50 w-48 h-36 rounded-xl overflow-hidden border-2 border-border shadow-xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1">
            <Camera className="h-3 w-3 text-success" />
            <span className="text-[10px] text-white font-medium">Live</span>
          </div>
        </div>
      )}
    </>
  )
}
