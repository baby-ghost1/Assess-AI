import { motion } from 'framer-motion'
import { Home, ArrowLeft, FileQuestion } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage({ className = '' }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center min-h-[70vh] px-6 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
      >
        <FileQuestion className="h-12 w-12 text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-6xl font-heading font-extrabold text-text-primary mb-2">404</h1>
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-4">Page Not Found</h2>
        <p className="text-sm text-text-secondary max-w-md leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light transition-colors duration-200 shadow-lg shadow-primary/20"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </button>
      </motion.div>
    </motion.div>
  )
}
