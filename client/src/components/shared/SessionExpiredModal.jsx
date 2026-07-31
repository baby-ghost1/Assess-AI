import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Clock } from 'lucide-react'
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-2xl text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 border border-warning/20">
              <Clock className="h-10 w-10 text-warning" />
            </div>

            <h2 className="text-2xl font-heading font-bold text-text-primary mb-2">
              Session Expired
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Your session has expired. Please log in again to continue.
            </p>

            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-light transition-colors duration-200 shadow-lg shadow-primary/20 w-full justify-center"
            >
              <LogOut className="h-4 w-4" />
              Log In Again
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
