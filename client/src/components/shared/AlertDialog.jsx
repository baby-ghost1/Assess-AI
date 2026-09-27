import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function AlertDialog() {
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    const handler = (e) => setAlert(e.detail || {})
    window.addEventListener('app:alert', handler)
    return () => window.removeEventListener('app:alert', handler)
  }, [])

  useEffect(() => {
    if (!alert) return
    const onKey = (e) => {
      if (e.key === 'Escape') setAlert(null)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [alert])

  const danger = (alert?.variant || 'danger') === 'danger'

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => setAlert(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-2xl p-[1px] shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]">
              <div className="rounded-2xl bg-bg-card p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${
                      danger ? 'bg-danger/10' : 'bg-primary/10'
                    }`}
                  >
                    <AlertTriangle className={`h-6 w-6 ${danger ? 'text-danger' : 'text-primary'}`} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-heading font-bold text-text-primary">
                      {alert.title || 'Something went wrong'}
                    </h3>
                    {alert.message && (
                      <p className="text-sm text-text-secondary mt-1.5 leading-relaxed break-words">
                        {alert.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setAlert(null)}
                    className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant={danger ? 'danger' : 'primary'}
                    onClick={() => setAlert(null)}
                    className="rounded-xl"
                    autoFocus
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
