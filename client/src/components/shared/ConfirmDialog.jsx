import { useEffect, useState } from 'react'
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
  confirmDisabled = false,
}) {
  const v = variants[variant] || variants.danger
  const Icon = v.icon

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !isPending) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isPending, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-sm rounded-2xl p-[1px] shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-transparent p-[1px]">
              <div className="rounded-2xl bg-bg-card p-6">
                <div className="flex items-start gap-3.5 mb-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${v.iconBg} ring-1 ring-inset ring-white/10`}>
                    <Icon className={`h-5 w-5 ${v.iconColor}`} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-heading font-bold text-text-primary">{title}</h3>
                    {message && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed break-words">{message}</p>}
                  </div>
                </div>

                {children && <div className="mb-5">{children}</div>}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={onCancel} disabled={isPending} autoFocus={!children} className="w-full rounded-xl sm:w-auto">{cancelLabel}</Button>
                  <Button variant={v.btnVariant} onClick={onConfirm} disabled={isPending || confirmDisabled} className="w-full rounded-xl sm:w-auto">
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

export function RejectDialog({
  open, onConfirm, onCancel, isPending,
  title = 'Reject', placeholder = 'Reason for rejection...',
  confirmLabel = 'Reject', pendingLabel = 'Rejecting...', message,
}) {
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
      message={message}
      variant="danger"
      confirmLabel={isPending ? pendingLabel : confirmLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isPending={isPending}
      confirmDisabled={!reason.trim()}
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
