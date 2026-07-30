import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Brain, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
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
          <span className="text-xl font-heading font-bold text-text-primary">AssessAI</span>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-text-primary">Check your email</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  If an account exists with <span className="font-medium text-text-primary">{email}</span>, we've sent a password reset link.
                </p>
              </div>
              <p className="text-xs text-text-tertiary">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Try another email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-primary">Forgot password?</h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Enter your email address and we'll send you a link to reset your password.
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
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-colors"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    'Send reset link'
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
