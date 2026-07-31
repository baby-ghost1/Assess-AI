import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, Brain, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { BrandLogo } from '@/components/shared'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password, confirmPassword })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-primary items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <BrandLogo className="text-xl" />
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-text-primary">Password reset successful</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-primary">Reset password</h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-[10px] font-bold">!</span>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-colors"
                      placeholder="Min 6 characters"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
