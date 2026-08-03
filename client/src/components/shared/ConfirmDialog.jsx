import { useState } from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const variants = {
  danger: { icon: AlertTriangle, iconBg: 'bg-danger/10', iconColor: 'text-danger', btnVariant: 'danger', glow: 'shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]' },
  success: { icon: CheckCircle, iconBg: 'bg-success/10', iconColor: 'text-success', btnVariant: 'primary', glow: 'shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]' },
  warning: { icon: AlertTriangle, iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500', btnVariant: 'danger', glow: 'shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)]' },
  info: { icon: Info, iconBg: 'bg-primary/10', iconColor: 'text-primary', btnVariant: 'primary', glow: 'shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]' },
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-sm rounded-2xl p-[1px] ${v.glow}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]">
              <div className="rounded-2xl bg-bg-card p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${v.iconBg} ring-1 ring-inset ring-white/10`}>
                    <Icon className={`h-6 w-6 ${v.iconColor}`} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-heading font-bold text-text-primary">{title}</h3>
                    {message && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{message}</p>}
                  </div>
                </div>

                {children && <div className="mb-5">{children}</div>}

                <div className="flex items-center justify-end gap-3">
                  <Button variant="secondary" onClick={onCancel} disabled={isPending} className="rounded-xl">{cancelLabel}</Button>
                  <Button variant={v.btnVariant} onClick={onConfirm} disabled={isPending} className="rounded-xl">
                    {isPending ? 'Processing...' : confirmLabel}
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
        className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        placeholder={placeholder}
        autoFocus
      />
    </ConfirmDialog>
  )
}
