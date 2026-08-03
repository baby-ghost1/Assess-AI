import { useState } from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const variants = {
  danger: { icon: AlertTriangle, iconBg: 'bg-danger/10', iconColor: 'text-danger', btnVariant: 'danger' },
  success: { icon: CheckCircle, iconBg: 'bg-success/10', iconColor: 'text-success', btnVariant: 'primary' },
  warning: { icon: AlertTriangle, iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500', btnVariant: 'danger' },
  info: { icon: Info, iconBg: 'bg-primary/10', iconColor: 'text-primary', btnVariant: 'primary' },
}

export default function ConfirmDialog({
  open, title, message, onConfirm, onCancel, isPending,
  variant = 'danger', confirmLabel = 'Confirm', cancelLabel = 'Cancel', children,
}) {
  const v = variants[variant] || variants.danger
  const Icon = v.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-border bg-bg-card p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${v.iconBg}`}>
                <Icon className={`h-5 w-5 ${v.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                {message && <p className="text-sm text-text-secondary mt-1">{message}</p>}
              </div>
            </div>

            {children && <div className="mb-4">{children}</div>}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={isPending}>{cancelLabel}</Button>
              <Button variant={v.btnVariant} onClick={onConfirm} disabled={isPending}>
                {isPending ? 'Processing...' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function RejectDialog({ open, onConfirm, onCancel, isPending, title = 'Reject', placeholder = 'Reason for rejection...' }) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  const handleCancel = () => {
    setReason('')
    onCancel()
  }

  return (
    <ConfirmDialog
      open={open}
      title={title}
      variant="danger"
      confirmLabel={isPending ? 'Rejecting...' : 'Reject'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isPending={isPending || !reason.trim()}
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        placeholder={placeholder}
        autoFocus
      />
    </ConfirmDialog>
  )
}
