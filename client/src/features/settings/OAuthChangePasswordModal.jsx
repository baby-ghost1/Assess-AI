import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch } from '@/hooks'
import { sendPasswordOtp, verifyPasswordOtp } from '@/features/auth/authSlice'
import {
  X, Mail, KeyRound, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff,
  Shield, Check, Timer, Fingerprint, AlertTriangle, ShieldCheck
} from 'lucide-react'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30
const SUCCESS_AUTO_CLOSE_MS = 5000

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir * 56, scale: 0.96, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
  exit: (dir) => ({ opacity: 0, x: dir * -56, scale: 0.96, filter: 'blur(6px)' }),
}

const springTransition = { type: 'spring', stiffness: 300, damping: 30 }

function OtpInput({ value, onChange, onComplete, error, disabled }) {
  const refs = useRef([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const handleChange = (i, raw) => {
    const digit = raw.replace(/\D/g, '')
    if (!digit) return
    const digits = value.padEnd(OTP_LENGTH, ' ').split('')
    digits[i] = digit[digit.length - 1]
    const next = digits.join('').trim().slice(0, OTP_LENGTH)
    onChange(next)
    const nextIndex = Math.min(i + 1, OTP_LENGTH - 1)
    refs.current[nextIndex]?.focus()
    if (next.length === OTP_LENGTH) onComplete?.(next)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1))
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i))
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!digits) return
    onChange(digits)
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
    if (digits.length === OTP_LENGTH) onComplete?.(digits)
  }

  return (
    <motion.div
      className="flex justify-center gap-2.5"
      animate={error ? { x: [0, -10, 10, -7, 7, -4, 4, 0], transition: { duration: 0.45 } } : { x: 0 }}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
        const filled = Boolean(value[i])
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            inputMode="numeric"
            maxLength={2}
            value={value[i] || ''}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-11 sm:w-12 h-14 rounded-xl text-center text-xl font-mono font-bold outline-none transition-all duration-200 border ${
              error
                ? 'border-danger/60 bg-danger/10 text-danger'
                : filled
                  ? 'border-primary/50 bg-primary/10 text-text-primary shadow-lg shadow-primary/10'
                  : 'border-border bg-bg-secondary text-text-primary hover:border-border-light focus:border-primary/60 focus:bg-primary/5 focus:ring-2 focus:ring-primary/30 focus:shadow-lg focus:shadow-primary/10'
            }`}
          />
        )
      })}
    </motion.div>
  )
}

function PasswordField({ label, value, onChange, show, onToggleShow, placeholder, error }) {
  return (
    <div>
      <label className="text-sm font-medium text-white/90 flex items-center gap-2 mb-1.5">
        <Shield className="h-3.5 w-3.5 text-primary" /> {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 transition-colors ${
            error ? 'border-danger/50 focus:ring-danger/40 focus:border-danger/50'
              : value
                ? 'border-emerald-500/40 focus:ring-emerald-500/30 focus:border-emerald-500/50'
                : 'border-white/10 focus:ring-primary/40 focus:border-primary/50'
          }`}
        />
        <button type="button" onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default function OAuthChangePasswordModal({ open, onClose, user }) {
  const dispatch = useAppDispatch()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [closing, setClosing] = useState(false)
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSuccess = step === 4
  const progress = isSuccess ? 100 : (step / 3) * 100
  const passwordsMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword)
  const canSubmitPassword = newPassword.length >= 6 && passwordsMatch

  const strength = (() => {
    let score = 0
    if (newPassword.length >= 6) score++
    if (newPassword.length >= 10) score++
    if (newPassword.length >= 14) score++
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++
    if (/\d/.test(newPassword)) score++
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++
    if (score <= 2) return { label: 'Weak', color: '#EF4444', segments: 1 }
    if (score <= 3) return { label: 'Fair', color: '#F59E0B', segments: 2 }
    if (score <= 4) return { label: 'Moderate', color: '#F59E0B', segments: 3 }
    return { label: 'Strong', color: '#22C55E', segments: 4 }
  })()

  const closeModal = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      setStep(1)
      setDirection(1)
      setClosing(false)
      setOtp('')
      setCooldown(0)
      setNewPassword('')
      setConfirmPassword('')
      setShowNew(false)
      setShowConfirm(false)
      setLoading(false)
      setError('')
      onClose()
    }, 220)
  }, [closing, onClose])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') closeModal() }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKey)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, closeModal])

  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(closeModal, SUCCESS_AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [isSuccess, closeModal])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1)
    setError('')
    setStep(next)
  }

  const handleSendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await dispatch(sendPasswordOtp()).unwrap()
      setOtp('')
      setCooldown(RESEND_COOLDOWN)
      goTo(2)
    } catch (err) {
      setError(err || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (code) => {
    setError('')
    if (!code || code.length !== OTP_LENGTH) return
    setLoading(true)
    try {
      await dispatch(verifyPasswordOtp({ otp: code })).unwrap()
      setOtp(code)
      goTo(3)
    } catch (err) {
      setOtp('')
      setError(err || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtpManually = () => handleVerifyOtp(otp)

  const handleSubmitPassword = async () => {
    setError('')
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!passwordsMatch) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await dispatch(verifyPasswordOtp({ otp, newPassword })).unwrap()
      goTo(4)
    } catch (err) {
      setError(err || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        onClick={closeModal}
      />

      <motion.div className="fixed inset-0 pointer-events-none" animate={{ opacity: closing ? 0 : 1 }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: closing ? 0 : 1, y: closing ? 20 : 0, scale: closing ? 0.95 : 1 }}
        transition={springTransition}
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-br from-primary/50 via-primary/20 to-fuchsia-600/50"
      >
        <div className="relative flex flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-[#0E0E16]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
                className="relative rounded-xl bg-primary/10 p-2.5"
              >
                <KeyRound className="h-5 w-5 text-primary relative" />
              </motion.div>
              <div>
                <h3 className="text-lg font-heading font-bold text-white/90">Set Your Password</h3>
                <p className="text-xs text-white/40">
                  {isSuccess ? 'Password set' : `Step ${Math.min(step, 3)} of 3`}
                </p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-6 h-1 rounded-full bg-white/5 overflow-hidden shrink-0">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-fuchsia-500 to-primary shadow-[0_0_12px_rgba(139,92,246,0.5)]"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                className="space-y-5"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                        className="inline-flex rounded-full bg-primary/10 p-4"
                      >
                        <ShieldCheck className="h-10 w-10 text-primary" />
                      </motion.div>
                      <h4 className="text-xl font-heading font-bold text-white/90">No password set yet</h4>
                      <p className="text-sm text-white/40 max-w-sm mx-auto">
                        You signed up with <strong className="text-white/80">{user?.provider === 'google' ? 'Google' : 'GitHub'}</strong>,
                        so your account doesn&apos;t have a password. Set one now to log in with email &amp; password too.
                      </p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
                      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-600/10 p-4"
                    >
                      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                      <div className="relative flex items-start gap-3.5">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          className="relative shrink-0"
                        >
                          <div className="rounded-xl bg-gradient-to-br from-primary to-fuchsia-600 p-2.5 shadow-lg shadow-primary/30">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <motion.span
                            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-xl border-2 border-primary/50 pointer-events-none"
                          />
                        </motion.div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-white/90">Verify your email</p>
                            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                              We&apos;ll send a one-time code to confirm it&apos;s really you.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 min-w-0">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="truncate text-xs font-mono text-primary">{user?.email}</span>
                            <span className="ml-auto shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              {user?.provider === 'google' ? 'Google' : 'GitHub'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                          <p className="text-sm text-danger">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
                      ) : (
                        <><Mail className="h-4 w-4" /> Send OTP to Email</>
                      )}
                    </motion.button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.1 }}
                        className="inline-flex rounded-full bg-primary/10 p-4"
                      >
                        <Fingerprint className="h-10 w-10 text-primary" />
                      </motion.div>
                      <h4 className="text-xl font-heading font-bold text-white/90">Check Your Email</h4>
                      <p className="text-sm text-white/40 max-w-sm mx-auto">
                        We sent a 6-digit code to <strong className="text-white/90">{user?.email}</strong>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <OtpInput
                        value={otp}
                        onChange={(v) => { setOtp(v); setError('') }}
                        onComplete={handleVerifyOtp}
                        error={error}
                        disabled={loading}
                      />
                      <div className="flex items-center justify-center gap-1.5 text-xs text-white/35">
                        <Timer className="h-3.5 w-3.5" />
                        {cooldown > 0 ? (
                          <span>Resend available in <strong className="text-white/60 font-mono">{cooldown}s</strong></span>
                        ) : (
                          <span>Code expires in 10 minutes</span>
                        )}
                      </div>

                      <div className="text-center">
                        {cooldown > 0 ? (
                          <span className="text-xs text-white/30">Didn&apos;t get it? Try again in {cooldown}s</span>
                        ) : (
                          <span className="text-sm text-white/50">
                            Didn&apos;t get it?{' '}
                            <button onClick={handleSendOtp} disabled={loading}
                              className="text-primary hover:text-primary/80 font-medium transition-colors">
                              Resend
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                          <p className="text-sm text-danger">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => goTo(1)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all">
                        <ArrowLeft className="h-4 w-4" /> Go Back
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerifyOtpManually}
                        disabled={loading || otp.length !== OTP_LENGTH}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                        ) : (
                          <>Verify <ArrowRight className="h-4 w-4" /></>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                        className="inline-flex rounded-full bg-primary/10 p-4"
                      >
                        <ShieldCheck className="h-10 w-10 text-primary" />
                      </motion.div>
                      <h4 className="text-xl font-heading font-bold text-white/90">Create a password</h4>
                      <p className="text-sm text-white/40 max-w-sm mx-auto">
                        This will be used for email &amp; password login. Your {user?.provider === 'google' ? 'Google' : 'GitHub'} login will keep working too.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <PasswordField
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                        show={showNew}
                        onToggleShow={() => setShowNew(!showNew)}
                        placeholder="Enter new password"
                      />
                      {newPassword && (
                        <div className="mt-1">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <motion.div
                                key={i}
                                className="h-1 flex-1 rounded-full"
                                animate={{ backgroundColor: i <= strength.segments ? strength.color : '#FFFFFF14' }}
                                transition={{ duration: 0.2 }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-medium" style={{ color: strength.color }}>Password strength: {strength.label}</p>
                        </div>
                      )}
                      <PasswordField
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                        show={showConfirm}
                        onToggleShow={() => setShowConfirm(!showConfirm)}
                        placeholder="Confirm new password"
                      />
                      <AnimatePresence>
                        {confirmPassword && !passwordsMatch && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-danger"
                          >
                            Passwords do not match
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                          <p className="text-sm text-danger">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => goTo(2)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all">
                        <ArrowLeft className="h-4 w-4" /> Go Back
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmitPassword}
                        disabled={loading || !canSubmitPassword}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Setting...</>
                        ) : (
                          <><ShieldCheck className="h-4 w-4" /> Set Password</>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex flex-col items-center justify-center min-h-[320px] text-center space-y-5 py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />
                      <motion.div
                        animate={{ boxShadow: ['0 0 40px rgba(16,185,129,0.35)', '0 0 80px rgba(16,185,129,0.55)', '0 0 40px rgba(16,185,129,0.35)'] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600"
                      >
                        <svg viewBox="0 0 52 52" className="w-12 h-12">
                          <motion.path
                            d="M14 27l8 8 16-16"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
                          />
                        </svg>
                      </motion.div>
                    </motion.div>

                    <div className="space-y-2">
                      <h4 className="text-2xl font-heading font-bold text-white/90">Password Set!</h4>
                      <p className="text-sm text-white/40 max-w-xs mx-auto">
                        You can now log in with your email &amp; password. Your {user?.provider === 'google' ? 'Google' : 'GitHub'} login still works too.
                      </p>
                    </div>

                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={closeModal}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-8 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all"
                    >
                      <Check className="h-4 w-4" /> Done
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
