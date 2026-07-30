import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { register as registerUser, clearError } from './authSlice'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Brain, ArrowRight, CheckCircle, UserCheck, FileEdit } from 'lucide-react'
import gsap from 'gsap'

const registerSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

const PASSWORD_RULES = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
]

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function FloatingInput({ label, icon: Icon, error, registration, type, showToggle, showState, onToggleShow, autoFocus }) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const iconRef = useRef(null)
  const glowRef = useRef(null)

  const isActive = focused || hasValue

  const handleFocus = () => {
    setFocused(true)
    gsap.to(iconRef.current, { scale: 1.2, color: 'var(--color-accent, #06B6D4)', duration: 0.3, ease: 'back.out(1.7)' })
    gsap.to(glowRef.current, { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' })
    gsap.to(wrapperRef.current, { borderColor: 'var(--color-accent, #06B6D4)', duration: 0.3 })
  }

  const handleBlur = (e) => {
    setFocused(false)
    setHasValue(e.target.value.length > 0)
    gsap.to(iconRef.current, { scale: 1, color: 'var(--color-text-tertiary)', duration: 0.3 })
    gsap.to(glowRef.current, { opacity: 0, scaleX: 0, duration: 0.3 })
    gsap.to(wrapperRef.current, { borderColor: error ? 'var(--color-danger)' : 'var(--color-border)', duration: 0.3 })
  }

  const handleChange = (e) => setHasValue(e.target.value.length > 0)

  useEffect(() => {
    if (inputRef.current?.value) setHasValue(true)
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  return (
    <div className="form-field">
      <div ref={wrapperRef} className="relative rounded-xl border border-border bg-bg-secondary transition-colors">
        <div ref={iconRef} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <Icon className="h-4 w-4 text-text-tertiary" />
        </div>
        <label className={`absolute z-10 pointer-events-none transition-all duration-300 ease-out ${
          isActive
            ? 'text-[11px] left-3 -top-2.5 text-accent font-medium scale-[0.92] origin-left bg-bg-card px-1'
            : 'text-sm left-10 top-1/2 -translate-y-1/2 text-text-tertiary scale-100'
        }`}>{label}</label>
        <div className="relative overflow-hidden rounded-b-[11px]">
          <div ref={glowRef} className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-primary opacity-0 origin-center" style={{ transform: 'scaleX(0)' }} />
          <input
            ref={inputRef}
            type={showToggle ? (showState ? 'text' : 'password') : type || 'text'}
            {...registration}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={(e) => { registration.onChange(e); handleChange(e) }}
            className="w-full bg-transparent py-3 pl-10 pr-10 text-sm text-text-primary outline-none placeholder-transparent"
            placeholder={label}
          />
          {showToggle && (
            <button type="button" onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors p-0.5 z-20">
              {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      <div className="min-h-[20px]">
        {error && (
          <p className="mt-1 ml-1 text-xs text-danger flex items-center gap-1">
            <span className="inline-block h-1 w-1 rounded-full bg-danger shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function PasswordStrength({ value }) {
  const passed = value ? PASSWORD_RULES.filter((r) => r.test(value)).length : 0
  const colors = ['bg-danger', 'bg-warning', 'bg-success']
  const labels = ['Weak', 'Fair', 'Strong']
  const labelColors = ['text-danger', 'text-warning', 'text-success']

  return (
    <div className="form-field space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">Password strength</span>
        <span className={`text-[11px] font-semibold ${passed > 0 ? labelColors[passed - 1] : 'text-text-tertiary'}`}>
          {passed > 0 ? labels[passed - 1] : 'Not set'}
        </span>
      </div>
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${value && i < passed ? colors[passed - 1] : ''}`} style={{ width: value && i < passed ? '100%' : '0%' }} />
          </div>
        ))}
      </div>
      <div className="space-y-1 pt-0.5">
        {PASSWORD_RULES.map((rule) => {
          const checked = value && rule.test(value)
          return (
            <div key={rule.label} className="flex items-center gap-1.5">
              <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${checked ? 'bg-success/15' : 'bg-bg-tertiary'}`}>
                <CheckCircle className={`h-2.5 w-2.5 transition-all duration-300 ${checked ? 'text-success scale-100' : 'text-text-tertiary scale-75'}`} />
              </div>
              <span className={`text-[11px] transition-colors duration-200 ${checked ? 'text-success' : 'text-text-tertiary'}`}>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RippleButton({ children, isLoading, disabled, className = '', ...props }) {
  const btnRef = useRef(null)

  const handleClick = (e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ripple = document.createElement('span')
    ripple.className = 'absolute rounded-full bg-white/25 pointer-events-none'
    ripple.style.cssText = `left:${x}px;top:${y}px;width:0;height:0`
    btn.appendChild(ripple)
    gsap.to(ripple, { width: 300, height: 300, x: -150, y: -150, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() })
  }

  return (
    <button ref={btnRef} onClick={handleClick} disabled={disabled || isLoading} className={`group/btn relative overflow-hidden ${className}`} {...props}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Creating account...</span>
        </div>
      ) : (
        <span className="flex items-center justify-center gap-2">{children}</span>
      )}
    </button>
  )
}

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth)
  const [show, setShow] = useState({ pass: false, confirm: false })
  const [role, setRole] = useState('candidate')
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) })
  const passwordValue = watch('password', '')

  const containerRef = useRef(null)
  const leftPanelRef = useRef(null)
  const cardRef = useRef(null)
  const cardBorderRef = useRef(null)
  const logoRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const statsRef = useRef(null)
  const formRef = useRef(null)
  const errorRef = useRef(null)
  const orbsRef = useRef(null)
  const dividerRef = useRef(null)

  useEffect(() => { if (isAuthenticated) navigate('/dashboard') }, [isAuthenticated, navigate])
  useEffect(() => () => dispatch(clearError()), [dispatch])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from(leftPanelRef.current, { x: -80, opacity: 0, duration: 0.8 })
        .from(logoRef.current, { scale: 0, rotation: -180, duration: 0.6, ease: 'elastic.out(1, 0.5)' }, '-=0.4')
        .from(titleRef.current?.children || [], { y: 40, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.3')
        .from(subtitleRef.current, { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')
        .from(statsRef.current?.children || [], { y: 30, opacity: 0, stagger: 0.1, duration: 0.4 }, '-=0.2')

      gsap.from(cardRef.current, { y: 60, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power2.out', delay: 0.3 })
      gsap.to(cardBorderRef.current, { backgroundPosition: '200% center', duration: 4, repeat: -1, ease: 'none' })

      const formFields = formRef.current?.querySelectorAll('.form-field') || []
      gsap.from(formFields, { y: 25, opacity: 0, stagger: 0.07, duration: 0.4, delay: 0.5, ease: 'power2.out' })

      if (dividerRef.current) gsap.from(dividerRef.current, { scaleX: 0, opacity: 0, duration: 0.5, delay: 1.1, ease: 'power2.out' })

      const orbs = orbsRef.current?.querySelectorAll('.orb') || []
      orbs.forEach((orb, i) => {
        gsap.to(orb, { y: `${20 + i * 10}`, x: `${10 + i * 5}`, duration: 3 + i * 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 })
        gsap.to(orb, { scale: 1 + i * 0.15, opacity: 0.5 + i * 0.1, duration: 2 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2 })
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) gsap.fromTo(errorRef.current, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  }, [error])

  return (
    <div ref={containerRef} className="flex min-h-screen bg-bg-primary overflow-hidden">
      {/* LEFT PANEL */}
      <div ref={leftPanelRef} className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-bg-primary to-primary/10" />
        <div ref={orbsRef} className="absolute inset-0 pointer-events-none">
          <div className="orb absolute top-[20%] left-[25%] w-64 h-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="orb absolute top-[50%] right-[10%] w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="orb absolute bottom-[15%] left-[20%] w-56 h-56 rounded-full bg-accent/10 blur-2xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-lg px-12">
          <div ref={logoRef} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-2xl shadow-accent/25">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div ref={titleRef}>
            <h1 className="text-5xl font-heading font-extrabold text-text-primary leading-tight">Join AssessAI</h1>
            <h2 className="mt-2 text-3xl font-heading font-bold text-text-primary">Start Your Journey</h2>
          </div>
          <p ref={subtitleRef} className="mt-5 text-lg text-text-secondary leading-relaxed">
            Create your account and unlock AI-powered assessments, smart question generation, and instant analytics.
          </p>
          <div ref={statsRef} className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '50K+', label: 'Assessments' },
              { value: '98%', label: 'Satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-bg-card/50 border border-border/50">
                <p className="text-2xl font-heading font-bold text-accent">{value}</p>
                <p className="text-xs text-text-tertiary mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Form) */}
      <div className="flex w-full lg:w-[45%] items-center justify-center px-6 py-12">
        <div ref={cardRef} className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-text-primary">AssessAI</span>
          </div>

          <div className="relative rounded-2xl p-[1px] overflow-hidden">
            <div ref={cardBorderRef} className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, #27272A, #06B6D4, #4F46E5, #27272A)', backgroundSize: '300% 300%' }} />
            <div className="relative rounded-2xl bg-bg-card/95 backdrop-blur-xl p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-heading font-bold text-text-primary">Create an account</h3>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {role === 'candidate' ? 'Join as a candidate to start taking assessments' : 'Join as a setter to create and manage assessments'}
                </p>
              </div>

              {/* Role Selector */}
              <div className="flex gap-3 mb-6">
                <button type="button" onClick={() => setRole('candidate')}
                  className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all duration-200 ${
                    role === 'candidate' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-bg-secondary hover:border-border-light hover:bg-bg-tertiary'
                  }`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${role === 'candidate' ? 'bg-primary/10 text-primary' : 'bg-bg-tertiary text-text-tertiary'}`}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${role === 'candidate' ? 'text-primary' : 'text-text-primary'}`}>Candidate</p>
                    <p className="text-[11px] text-text-tertiary">Take assessments</p>
                  </div>
                </button>
                <button type="button" onClick={() => setRole('setter')}
                  className={`flex-1 flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all duration-200 ${
                    role === 'setter' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-bg-secondary hover:border-border-light hover:bg-bg-tertiary'
                  }`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${role === 'setter' ? 'bg-primary/10 text-primary' : 'bg-bg-tertiary text-text-tertiary'}`}>
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${role === 'setter' ? 'text-primary' : 'text-text-primary'}`}>Setter</p>
                    <p className="text-[11px] text-text-tertiary">Create questions</p>
                  </div>
                </button>
              </div>

              <form ref={formRef} onSubmit={handleSubmit((d) => dispatch(registerUser({ name: d.name, email: d.email, password: d.password, role })))} className="space-y-4">
                {error && (
                  <div ref={errorRef} className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-[10px] font-bold">!</span>
                    {error}
                  </div>
                )}

                <div className="form-field">
                  <FloatingInput label="Full name" icon={User} error={errors.name?.message} registration={register('name')} autoFocus />
                  {watch('name') && (
                    <div className="mt-1 ml-1 flex justify-end">
                      <span className={`text-[10px] font-medium ${watch('name').length >= 2 ? 'text-success' : 'text-text-tertiary'}`}>
                        {watch('name').length}/50
                      </span>
                    </div>
                  )}
                </div>

                <FloatingInput label="Email address" icon={Mail} error={errors.email?.message} registration={register('email')} type="email" />
                <FloatingInput label="Password" icon={Lock} error={errors.password?.message} registration={register('password')} showToggle showState={show.pass} onToggleShow={() => setShow({ ...show, pass: !show.pass })} />
                <PasswordStrength value={passwordValue} />
                <FloatingInput label="Confirm password" icon={Lock} error={errors.confirmPassword?.message} registration={register('confirmPassword')} showToggle showState={show.confirm} onToggleShow={() => setShow({ ...show, confirm: !show.confirm })} />

                <div className="form-field pt-2">
                  <RippleButton type="submit" isLoading={isLoading} disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-dark px-4 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-accent/25 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    Create {role === 'candidate' ? 'candidate' : 'setter'} account
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </RippleButton>
                </div>
              </form>

              <div ref={dividerRef} className="relative my-7">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-bg-card px-3 text-text-tertiary font-medium tracking-wider">or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a href={`${API_BASE}/auth/google`} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary py-2.5 text-sm font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-light hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 transition-all duration-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </a>
                <a href={`${API_BASE}/auth/github`} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary py-2.5 text-sm font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-light hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/5 transition-all duration-200">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </div>

              <div className="mt-7 pt-6 border-t border-border">
                <p className="text-center text-sm text-text-secondary">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
