import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, AlertTriangle, X } from 'lucide-react'
import useSlowConnection from '@/hooks/useSlowConnection'

export default function SlowInternetWarning() {
  const { isSlow, dismiss } = useSlowConnection()

  return (
    <AnimatePresence>
      {isSlow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-md px-4"
        >
          <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 backdrop-blur-xl px-4 py-3 shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/20">
              <Wifi className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Slow Connection Detected</p>
              <p className="text-xs text-text-secondary truncate">Some features may take longer to load</p>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 p-1 rounded-lg hover:bg-bg-tertiary transition-colors text-text-tertiary hover:text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
