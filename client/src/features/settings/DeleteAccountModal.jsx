import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks'
import { deleteAccount, sendDeleteOtp, verifyDeleteOtp, logout } from '@/features/auth/authSlice'
import { notify } from '@/lib/notify'
import {
  X, Heart, AlertTriangle, Eye, EyeOff, Loader2, ArrowRight,
  BarChart3, Brain, Trophy, Users, Sparkles, Shield, Mail, Trash2, KeyRound
} from 'lucide-react'

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

export default function DeleteAccountModal({ open, onClose, user }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isOAuth = user?.provider && user.provider !== 'local'
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    setStep(1)
    setPassword('')
    setShowPassword(false)
    setConfirmation('')
    setSelectedReason('')
    setCustomReason('')
    setOtp('')
    setOtpSent(false)
    setError('')
    onClose()
  }

  const handleSendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await dispatch(sendDeleteOtp()).unwrap()
      setOtpSent(true)
      setStep(4)
      notify.success('OTP sent to your email')
    } catch (err) {
      setError(err || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setError('')
    if (!isOAuth && !password) { setError('Please enter your password'); return }
    if (confirmation !== 'DELETE MY ACCOUNT') { setError('Please type "DELETE MY ACCOUNT" to confirm'); return }

    setLoading(true)
    try {
      if (isOAuth) {
        await dispatch(verifyDeleteOtp(otp)).unwrap()
      } else {
        await dispatch(deleteAccount({
          password,
          confirmation,
          reason: selectedReason === 'Other' ? customReason : selectedReason,
        })).unwrap()
      }
      notify.success('Account deleted successfully')
      localStorage.removeItem('accessToken')
      handleClose()
      navigate('/login')
    } catch (err) {
      setError(err || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-danger/10 p-2.5">
              <Trash2 className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-text-primary">Delete Account</h3>
              <p className="text-xs text-text-secondary">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-bg-tertiary shrink-0">
          <div className="h-full bg-danger transition-all duration-500 ease-out" style={{ width: `${(step / (isOAuth ? 4 : 3)) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Retention */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex mx-auto rounded-full bg-danger/10 p-4">
                  <Heart className="h-10 w-10 text-danger animate-pulse" />
                </div>
                <h4 className="text-xl font-heading font-bold text-text-primary">We&apos;ll really miss you!</h4>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  Before you go, here&apos;s what you&apos;ll be leaving behind on AssessAI:
                </p>
              </div>

              <div className="space-y-3">
                {RETENTION_REASONS.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border">
                    <div className={`shrink-0 rounded-lg p-2 ${r.color}`}>
                      <r.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-text-secondary">{r.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                  <Sparkles className="h-4 w-4" /> Stay & Keep Learning
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
                  I still want to delete <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Reason + Password */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="text-base font-heading font-semibold text-text-primary">Help us improve</h4>
                <p className="text-sm text-text-secondary">Why are you leaving? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {DELETION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason === selectedReason ? '' : reason)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                        selectedReason === reason
                          ? 'border-danger bg-danger/10 text-danger'
                          : 'border-border text-text-secondary hover:border-border-light hover:bg-bg-tertiary'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                {selectedReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={2}
                    placeholder="Tell us more..."
                    className="w-full mt-2 rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                  />
                )}
              </div>

              {!isOAuth && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <Shield className="h-4 w-4 text-danger" /> Confirm your password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              {isOAuth && (
                <div className="rounded-xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    You'll receive a one-time code at <strong>{user?.email}</strong> to verify your identity.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">
                  Go Back
                </button>
                <button
                  onClick={() => { if (isOAuth || password) setStep(3); else setError('Please enter your password') }}
                  disabled={!isOAuth && !password}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Final confirmation */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="inline-flex mx-auto rounded-full bg-danger/10 p-4">
                  <AlertTriangle className="h-10 w-10 text-danger" />
                </div>
                <h4 className="text-xl font-heading font-bold text-text-primary">This is irreversible</h4>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  All your data, progress, achievements, and analytics will be permanently lost.
                </p>
              </div>

              <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 space-y-2">
                <p className="text-sm font-medium text-danger flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> What happens when you delete:
                </p>
                <ul className="text-xs text-text-secondary space-y-1.5 ml-6">
                  <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Your profile and account data will be erased</li>
                  <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> All assessment history and scores will be lost</li>
                  <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Analytics and progress tracking will be removed</li>
                  <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> You will be logged out immediately</li>
                  <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> This action cannot be undone</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Type <span className="font-mono font-bold text-danger">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder='Type "DELETE MY ACCOUNT"'
                    className="w-full rounded-xl border border-border bg-bg-secondary pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger transition-colors font-mono"
                  />
                </div>
                {confirmation && confirmation !== 'DELETE MY ACCOUNT' && (
                  <p className="text-xs text-danger">Text does not match. Please type exactly: DELETE MY ACCOUNT</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">
                  Go Back
                </button>
                {isOAuth ? (
                  <button
                    onClick={() => { handleSendOtp() }}
                    disabled={loading || confirmation !== 'DELETE MY ACCOUNT'}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      <><KeyRound className="h-4 w-4" /> Send OTP to Email</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDelete}
                    disabled={loading || confirmation !== 'DELETE MY ACCOUNT'}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                    ) : (
                      <><Trash2 className="h-4 w-4" /> Delete My Account</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: OTP verification (OAuth only) */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="inline-flex mx-auto rounded-full bg-primary/10 p-4">
                  <KeyRound className="h-10 w-10 text-primary" />
                </div>
                <h4 className="text-xl font-heading font-bold text-text-primary">Check Your Email</h4>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  We sent a 6-digit code to <strong className="text-text-primary">{user?.email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary text-center block">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-2xl font-mono tracking-[12px] rounded-xl border border-border bg-bg-secondary px-4 py-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-text-tertiary text-center">Expires in 10 minutes</p>
              </div>

              {!otpSent && (
                <p className="text-sm text-text-secondary text-center">
                  Didn't get it?{' '}
                  <button onClick={handleSendOtp} disabled={loading}
                    className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Resend
                  </button>
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => { setStep(3); setOtp(''); setError('') }}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors">
                  Go Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><Trash2 className="h-4 w-4" /> Delete My Account</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
