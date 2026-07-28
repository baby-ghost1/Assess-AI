import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({
  error,
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  const message = error?.message || description || 'An unexpected error occurred. Please try again.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20">
        <AlertTriangle className="h-10 w-10 text-danger" />
      </div>

      <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
        {title}
      </h3>

      <p className="text-sm text-text-secondary max-w-sm leading-relaxed mb-6">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light transition-colors duration-200 shadow-lg shadow-primary/20"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>
      )}
    </motion.div>
  )
}
