import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Clock, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SessionExpiredModal() {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        setShow(true)
      }
    }

    const handleAuthEvent = () => setShow(true)

    window.addEventListener('storage', handleStorage)
    window.addEventListener('session-expired', handleAuthEvent)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('session-expired', handleAuthEvent)
    }
  }, [])

  const handleLogin = () => {
    setShow(false)
    navigate('/login')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mx-4 w-full max-w-sm"
          >
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] shadow-[0_0_60px_-15px_rgba(234,179,8,0.3)]">
              <div className="rounded-2xl bg-bg-card p-8 text-center">
                <div className="relative inline-flex mb-6">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 ring-1 ring-inset ring-white/10"
                  >
                    <Clock className="h-10 w-10 text-amber-400" />
                  </motion.div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-danger/20 ring-2 ring-bg-card">
                    <ShieldAlert className="h-3.5 w-3.5 text-danger" />
                  </div>
                </div>

                <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
                  Session Expired
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-8">
                  Your session has expired for security reasons. Please log in again to continue.
                </p>

                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 w-full justify-center hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut className="h-4 w-4" />
                  Log In Again
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
