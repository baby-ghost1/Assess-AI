import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Music, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LogoutDialog({ open, onConfirm, onCancel, isPending }) {
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
          onClick={() => { if (!isPending) onCancel?.() }}
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger ring-1 ring-inset ring-white/10">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-heading font-bold text-text-primary">Sign out?</h3>
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                      You'll be signed out of your account on this device.
                    </p>
                  </div>
                </div>

                <div className="mb-5 space-y-2 rounded-xl bg-bg-secondary p-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                    <Music className="h-3.5 w-3.5 shrink-0 text-accent" />
                    Any playing music will stop
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                    <KeyRound className="h-3.5 w-3.5 shrink-0 text-warning" />
                    You'll need to sign in again to access your account
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isPending}
                    autoFocus
                    className="w-full rounded-xl sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={isPending}
                    className="w-full rounded-xl sm:w-auto gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" /> Sign out
                      </>
                    )}
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
