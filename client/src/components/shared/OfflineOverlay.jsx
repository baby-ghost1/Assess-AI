import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, Signal } from 'lucide-react'
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="mx-4 w-full max-w-sm"
        >
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] shadow-[0_0_60px_-15px_rgba(239,68,68,0.3)]">
            <div className="rounded-2xl bg-bg-card p-8 text-center">
              <div className="relative inline-flex mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/15 to-danger/5 ring-1 ring-inset ring-white/10"
                >
                  <WifiOff className="h-10 w-10 text-danger" />
                </motion.div>
                {/* Animated signal waves */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-danger/20"
                      initial={{ width: 80, height: 80, opacity: 0.4 }}
                      animate={{ width: 120, height: 120, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
                No Internet Connection
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8">
                You're currently offline. Please check your network connection and try again.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 w-full justify-center hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-tertiary">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-danger"
                />
                <span className="flex items-center gap-1"><Signal className="h-3 w-3" /> Waiting for connection...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
