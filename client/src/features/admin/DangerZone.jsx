import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { notify } from '@/lib/notify'
import {
  Loader2, Trash2, AlertTriangle, Shield, Users, FileText,
  MessageSquare, Activity, Eye, Lock, CheckCircle2, ChevronRight
} from 'lucide-react'

const DATA_ITEMS = [
  { icon: Users, label: 'All Users', desc: 'Except your admin account', color: 'text-blue-500' },
  { icon: FileText, label: 'All Assessments', desc: 'Drafts, published, archived', color: 'text-purple-500' },
  { icon: FileText, label: 'All Questions', desc: 'Manual, AI-generated, imported', color: 'text-orange-500' },
  { icon: Activity, label: 'All Attempts & Submissions', desc: 'Candidate test history', color: 'text-red-500' },
  { icon: MessageSquare, label: 'All Coding Submissions', desc: 'Code, progress, comments, bookmarks', color: 'text-cyan-500' },
  { icon: Eye, label: 'All Proctoring Data', desc: 'Violations & monitoring logs', color: 'text-yellow-500' },
  { icon: Shield, label: 'Tags, Notifications & Settings', desc: 'Platform configuration & alerts', color: 'text-green-500' },
]

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
            i < currentStep
              ? 'bg-error text-white scale-100'
              : i === currentStep
                ? 'bg-error/20 text-error border-2 border-error scale-110'
                : 'bg-bg-tertiary text-text-secondary'
          }`}>
            {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 rounded transition-colors ${i < currentStep ? 'bg-error' : 'bg-bg-tertiary'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function DangerZone() {
  const [step, setStep] = useState(0)
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const resetMutation = useMutation({
    mutationFn: () => api.post('/admin/delete-all', { confirmation, password }),
    onSuccess: () => {
      setStep(3)
      notify.success('All data has been deleted successfully')
    },
    onError: (err) => {
      notify.error(err.response?.data?.message || 'Failed to delete data')
    },
  })

  const canProceed = () => {
    if (step === 1) return confirmation === 'DELETE ALL DATA'
    if (step === 2) return password.length > 0
    return false
  }

  const handleNext = () => {
    if (step === 2) {
      resetMutation.mutate()
    } else {
      setStep(step + 1)
    }
  }

  const handleClose = () => {
    setStep(0)
    setConfirmation('')
    setPassword('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-error/20 bg-gradient-to-br from-error/5 via-bg-card to-bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/10 shrink-0">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text-primary">Danger Zone</h2>
            <p className="text-sm text-text-secondary mt-1">
              Irreversible actions that permanently delete platform data. Proceed with extreme caution.
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DATA_ITEMS.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border bg-bg-card p-3.5">
            <item.icon className={`h-5 w-5 mt-0.5 shrink-0 ${item.color}`} />
            <div>
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Button */}
      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-error/40 bg-error/5 px-6 py-4 text-sm font-semibold text-error hover:bg-error/10 hover:border-error/60 transition-all"
        >
          <Trash2 className="h-5 w-5" />
          Delete All Data
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      )}

      {/* Step 1: Confirmation Text */}
      {step === 1 && (
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
          <StepIndicator currentStep={step} totalSteps={3} />

          <div className="flex items-center gap-3 rounded-lg bg-error/5 border border-error/20 p-4">
            <AlertTriangle className="h-5 w-5 text-error shrink-0" />
            <p className="text-sm text-text-primary">
              This action is <span className="font-bold text-error">permanent and irreversible</span>.
              All data will be lost forever.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Type <span className="font-mono bg-error/10 text-error px-2 py-0.5 rounded text-xs tracking-wider">DELETE ALL DATA</span> to confirm:
            </label>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-error focus:ring-1 focus:ring-error/30 focus:outline-none transition-colors"
              placeholder="DELETE ALL DATA"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-5 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Password */}
      {step === 2 && (
        <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
          <StepIndicator currentStep={step} totalSteps={3} />

          <div className="flex items-center gap-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
            <Lock className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-text-primary">
              Enter your admin password to verify your identity and authorize this action.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-primary px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-error focus:ring-1 focus:ring-error/30 focus:outline-none transition-colors"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || resetMutation.isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-error hover:bg-error/90 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors"
            >
              {resetMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Delete Everything</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-text-primary">Data Deleted Successfully</h3>
            <p className="text-sm text-text-secondary mt-1">
              All platform data has been permanently removed. Your admin account has been preserved.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
