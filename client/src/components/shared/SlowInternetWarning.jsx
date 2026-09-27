import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, X } from 'lucide-react'
import useSlowConnection from '@/hooks/useSlowConnection'

const DISMISSED_KEY = 'assessai_slow_net_dismissed'
const SEEN_KEY = 'assessai_slow_net_seen'
const RESHOW_MS = 10 * 60 * 1000
const VISIBLE_MS = 7000

export default function SlowInternetWarning() {
  const { isSlow } = useSlowConnection()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isSlow) {
      setVisible(false)
      return undefined
    }

    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) return undefined
      const lastSeen = Number(sessionStorage.getItem(SEEN_KEY) || 0)
      if (Date.now() - lastSeen < RESHOW_MS) return undefined
      sessionStorage.setItem(SEEN_KEY, String(Date.now()))
    } catch { /* noop */ }

    setVisible(true)
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [isSlow])

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch { /* noop */ }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-4 sm:right-6 z-[9998] max-w-[calc(100vw-2rem)]"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-warning/30 bg-bg-card/95 backdrop-blur-xl pl-3.5 pr-2 py-2 shadow-2xl">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-warning" />
            <p className="text-xs text-text-secondary">
              Slow connection — pages may take a bit longer
            </p>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 p-1 rounded-full hover:bg-bg-tertiary transition-colors text-text-tertiary hover:text-text-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
