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
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center relative ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none rounded-xl" />

      <div className="relative mb-6">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 ring-1 ring-inset ring-white/5 shadow-lg shadow-primary/10"
        >
          {Icon && <Icon className="h-10 w-10 text-primary/60" />}
        </motion.div>
        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      </div>

      <h3 className="relative text-xl font-heading font-bold text-text-primary mb-2">
        {title}
      </h3>

      {description && (
        <p className="relative text-sm text-text-secondary max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}

      {(action || (onAction && actionLabel)) && (
        <div className="relative">
          {action || (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
