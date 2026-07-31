import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch } from '@/hooks'
import { deleteAccount, sendDeleteOtp, verifyDeleteOtp, logout } from '@/features/auth/authSlice'
import {
  X, Heart, AlertTriangle, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft,
  BarChart3, Brain, Trophy, Users, Sparkles, Shield, Mail, Trash2, KeyRound,
  Copy, Check, Timer, LogIn, Fingerprint
} from 'lucide-react'

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT'
const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30
const SUCCESS_AUTO_REDIRECT_MS = 5000

const RETENTION_REASONS = [
  { icon: Brain, text: 'AI-powered assessments are helping you learn smarter', color: 'text-primary bg-primary/10' },
  { icon: BarChart3, text: 'Your analytics show great progress — keep going!', color: 'text-accent bg-accent/10' },
  { icon: Trophy, text: 'You have achievements and streaks waiting for you', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Users, text: 'Your peers and community value your participation', color: 'text-emerald-500 bg-emerald-500/10' },
]

const DELETION_REASONS = [
  'I found another platform',
  'The platform does not meet my needs',
  'I have privacy concerns',
  'I no longer need this service',
  'Other',
]

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir * 56, scale: 0.96, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
  exit: (dir) => ({ opacity: 0, x: dir * -56, scale: 0.96, filter: 'blur(6px)' }),
}

const springTransition = { type: 'spring', stiffness: 300, damping: 30 }

function PulseRing({ className }) {
  return (
    <span className="absolute inset-0 rounded-full border border-danger/40">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-danger/30"
          animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
        />
      ))}
    </span>
  )
}

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
                  ? 'border-danger/50 bg-danger/10 text-text-primary shadow-lg shadow-danger/10'
                  : 'border-border bg-bg-secondary text-text-primary hover:border-border-light focus:border-danger/60 focus:bg-danger/5 focus:ring-2 focus:ring-danger/30 focus:shadow-lg focus:shadow-danger/10'
            }`}
          />
        )
      })}
    </motion.div>
  )
}

export default function DeleteAccountModal({ open, onClose, user }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isOAuth = user?.provider && user.provider !== 'local'

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [closing, setClosing] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = isOAuth ? 4 : 3
  const isSuccess = step === 5
  const progress = isSuccess ? 100 : (step / totalSteps) * 100
  const confirmationMatches = confirmation === CONFIRM_PHRASE
  const confirmationRatio = Math.min(confirmation.length / CONFIRM_PHRASE.length, 1) * 100

  const closeModal = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      setStep(1)
      setDirection(1)
      setClosing(false)
      setPassword('')
      setShowPassword(false)
      setConfirmation('')
      setCopied(false)
      setSelectedReason('')
      setCustomReason('')
      setOtp('')
      setCooldown(0)
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
    const timer = setTimeout(() => navigate('/login', { replace: true }), SUCCESS_AUTO_REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [isSuccess, navigate])

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

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(CONFIRM_PHRASE)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  const handleSendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await dispatch(sendDeleteOtp()).unwrap()
      setOtp('')
      setCooldown(RESEND_COOLDOWN)
      goTo(4)
    } catch (err) {
      setError(err || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLocal = async () => {
    setError('')
    if (!password) { setError('Please enter your password'); return }
    if (!confirmationMatches) { setError(`Please type "${CONFIRM_PHRASE}" to confirm`); return }
    setLoading(true)
    try {
      await dispatch(deleteAccount({
        password,
        confirmation,
        reason: selectedReason === 'Other' ? customReason : selectedReason,
      })).unwrap()
      dispatch(logout())
      goTo(5)
    } catch (err) {
      setError(err || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    if (otp.length !== OTP_LENGTH) return
    setLoading(true)
    try {
      await dispatch(verifyDeleteOtp(otp)).unwrap()
      dispatch(logout())
      goTo(5)
    } catch (err) {
      setOtp('')
      setError(err || 'Invalid OTP')
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

      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: closing ? 0 : 1 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-danger/10 blur-[140px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: closing ? 0 : 1, y: closing ? 20 : 0, scale: closing ? 0.95 : 1 }}
        transition={springTransition}
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-br from-danger/50 via-danger/20 to-rose-500/50"
      >
        <div className="relative flex flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-[#0E0E16]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-danger/60 to-transparent" />

          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
                className="relative rounded-xl bg-danger/10 p-2.5"
              >
                <PulseRing />
                <Trash2 className="h-5 w-5 text-danger relative" />
              </motion.div>
              <div>
                <h3 className="text-lg font-heading font-bold text-white/90">Delete Account</h3>
                <p className="text-xs text-white/40">
                  {isSuccess ? 'Account removed' : `Step ${Math.min(step, totalSteps)} of ${totalSteps}`}
                </p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-6 h-1 rounded-full bg-white/5 overflow-hidden shrink-0">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-danger via-rose-500 to-danger shadow-[0_0_12px_rgba(239,68,68,0.5)]"
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
                      <div className="relative inline-flex mx-auto">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                          className="inline-flex rounded-full bg-danger/10 p-4"
                        >
                          <PulseRing />
                          <Heart className="h-10 w-10 text-danger relative" />
                        </motion.div>
                      </div>
                      <h4 className="text-xl font-heading font-bold text-white/90">We&apos;ll really miss you!</h4>
                      <p className="text-sm text-white/40 max-w-sm mx-auto">
                        Before you go, here&apos;s what you&apos;ll be leaving behind on AssessAI:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {RETENTION_REASONS.map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className={`shrink-0 rounded-lg p-2 ${r.color}`}>
                            <r.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm text-white/50">{r.text}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={closeModal}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all">
                        <Sparkles className="h-4 w-4" /> Stay & Keep Learning
                      </button>
                      <button onClick={() => goTo(2)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]">
                        I still want to delete <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="text-base font-heading font-semibold text-white/90">Help us improve</h4>
                      <p className="text-sm text-white/40">Why are you leaving? (optional)</p>
                      <div className="flex flex-wrap gap-2">
                        {DELETION_REASONS.map((reason) => (
                          <motion.button
                            key={reason}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelectedReason(reason === selectedReason ? '' : reason)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                              selectedReason === reason
                                ? 'border-danger/60 bg-danger/15 text-danger shadow-lg shadow-danger/10'
                                : 'border-white/10 text-white/50 hover:border-white/25 hover:bg-white/5'
                            }`}
                          >
                            {reason}
                          </motion.button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {selectedReason === 'Other' && (
                          <motion.textarea
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            rows={2}
                            placeholder="Tell us more..."
                            className="w-full mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-danger/40 focus:border-danger/50 transition-colors resize-none"
                          />
                        )}
                      </AnimatePresence>
                    </div>

                    {!isOAuth && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-danger" /> Confirm your password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your current password"
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-danger/40 focus:border-danger/50 transition-colors"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {isOAuth && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                      >
                        <p className="text-sm text-white/50 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                          You&apos;ll receive a one-time code at <strong className="text-white/90">{user?.email}</strong> to verify your identity.
                        </p>
                      </motion.div>
                    )}

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
                      <button onClick={() => goTo(1)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all">
                        <ArrowLeft className="h-4 w-4" /> Go Back
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { if (isOAuth || password) goTo(3); else setError('Please enter your password') }}
                        disabled={!isOAuth && !password}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
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
                        className="inline-flex rounded-full bg-danger/10 p-4"
                      >
                        <AlertTriangle className="h-10 w-10 text-danger" />
                      </motion.div>
                      <h4 className="text-xl font-heading font-bold text-white/90">This is irreversible</h4>
                      <p className="text-sm text-white/40 max-w-sm mx-auto">
                        All your data, progress, achievements, and analytics will be permanently lost.
                      </p>
                    </div>

                    <div className="rounded-xl border border-danger/25 bg-danger/5 p-4 space-y-2">
                      <p className="text-sm font-medium text-danger flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> What happens when you delete:
                      </p>
                      <ul className="text-xs text-white/50 space-y-1.5 ml-6">
                        <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Your profile and account data will be erased</li>
                        <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> All assessment history and scores will be lost</li>
                        <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Analytics and progress tracking will be removed</li>
                        <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> You will be logged out immediately</li>
                        <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> This action cannot be undone</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium text-white/90">
                          Type{' '}
                          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-danger/10 border border-danger/30 font-mono font-bold text-danger text-xs align-middle">
                            {CONFIRM_PHRASE}
                            <button
                              onClick={copyPhrase}
                              title="Copy phrase"
                              className={`p-0.5 rounded transition-colors ${copied ? 'text-emerald-400' : 'text-danger/70 hover:text-danger'}`}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </span>{' '}
                          to confirm:
                        </label>
                        {copied && <span className="text-[10px] font-medium text-emerald-400">Copied!</span>}
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                        <input
                          type="text"
                          value={confirmation}
                          onChange={(e) => { setConfirmation(e.target.value.toUpperCase()); setError('') }}
                          placeholder={`Type "${CONFIRM_PHRASE}"`}
                          className={`w-full rounded-xl border bg-white/[0.03] pl-10 pr-10 py-3 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-2 transition-colors font-mono ${
                            confirmationMatches
                              ? 'border-emerald-500/50 focus:ring-emerald-500/30 focus:border-emerald-500/60'
                              : confirmation
                                ? 'border-danger/50 focus:ring-danger/40 focus:border-danger/50'
                                : 'border-white/10 focus:ring-danger/40 focus:border-danger/50'
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {confirmationMatches ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : confirmation ? (
                            <span className="text-xs font-mono text-white/25">{confirmation.length}/{CONFIRM_PHRASE.length}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full ${confirmationMatches ? 'bg-emerald-500' : 'bg-danger'}`}
                          animate={{ width: `${confirmationRatio}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        />
                      </div>
                      <AnimatePresence>
                        {confirmation && !confirmationMatches && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-danger"
                          >
                            Text does not match. Use the copy icon to paste exactly: {CONFIRM_PHRASE}
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
                      {isOAuth ? (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleSendOtp}
                          disabled={loading || !confirmationMatches}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
                          ) : (
                            <><KeyRound className="h-4 w-4" /> Send OTP to Email</>
                          )}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleDeleteLocal}
                          disabled={loading || !confirmationMatches || !password}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                          ) : (
                            <><Trash2 className="h-4 w-4" /> Delete My Account</>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.1 }}
                        className="relative inline-flex rounded-full bg-primary/10 p-4"
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
                      <button onClick={() => goTo(3)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all">
                        <ArrowLeft className="h-4 w-4" /> Go Back
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== OTP_LENGTH}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                        ) : (
                          <><Trash2 className="h-4 w-4" /> Delete My Account</>
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
                      <h4 className="text-2xl font-heading font-bold text-white/90">Account Deleted</h4>
                      <p className="text-sm text-white/40 max-w-xs mx-auto">
                        Your account and all associated data have been permanently removed. We&apos;re sad to see you go.
                      </p>
                    </div>

                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/login', { replace: true })}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-8 py-3 text-sm font-semibold text-white hover:opacity-90 transition-all"
                    >
                      <LogIn className="h-4 w-4" /> Back to Login
                    </motion.button>
                    <p className="text-xs text-white/25">Redirecting automatically...</p>
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
