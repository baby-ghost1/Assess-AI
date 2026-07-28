import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'
import useOnlineStatus from '@/hooks/useOnlineStatus'

export default function OfflineOverlay() {
  const { isOnline } = useOnlineStatus()

  if (isOnline) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20">
            <WifiOff className="h-10 w-10 text-danger" />
          </div>

          <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
            No Internet Connection
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            You're currently offline. Please check your network connection and try again.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-light transition-colors duration-200 shadow-lg shadow-primary/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-tertiary">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
            Waiting for connection...
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
