import { motion } from 'framer-motion'

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50">
          <Icon className="h-10 w-10 text-primary/60" />
        </div>
      )}

      <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {(action || (onAction && actionLabel)) && (
        <div>
          {action || (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light transition-colors duration-200 shadow-lg shadow-primary/20"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
