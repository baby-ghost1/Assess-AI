import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { login, clearError } from './authSlice'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Brain, ArrowRight, Shield, Zap, CheckCircle } from 'lucide-react'
import gsap from 'gsap'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  rememberMe: z.boolean().optional().default(true),
})

const FEATURES = [
  { icon: Brain, text: 'AI-Powered Assessments' },
  { icon: Shield, text: 'Real-time Proctoring' },
  { icon: Zap, text: 'Instant Results & Analytics' },
]

function FloatingInput({ label, icon: Icon, error, registration, type, showToggle, showState, onToggleShow }) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const iconRef = useRef(null)
  const glowRef = useRef(null)
  const labelRef = useRef(null)

  const isActive = focused || hasValue

  const handleFocus = () => {
    setFocused(true)
    gsap.to(iconRef.current, { scale: 1.2, color: '#4F46E5', duration: 0.3, ease: 'back.out(1.7)' })
    gsap.to(glowRef.current, { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' })
    gsap.to(wrapperRef.current, { borderColor: 'rgba(79, 70, 229, 0.5)', duration: 0.3 })
  }

  const handleBlur = (e) => {
    setFocused(false)
    setHasValue(e.target.value.length > 0)
    gsap.to(iconRef.current, { scale: 1, color: '#71717A', duration: 0.3 })
    gsap.to(glowRef.current, { opacity: 0, scaleX: 0, duration: 0.3 })
    gsap.to(wrapperRef.current, { borderColor: error ? '#EF4444' : '#27272A', duration: 0.3 })
  }

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0)
  }

  useEffect(() => {
    if (inputRef.current?.value) setHasValue(true)
  }, [])

  return (
    <div className="form-field">
      <div
        ref={wrapperRef}
        className="relative rounded-xl border border-border bg-bg-secondary transition-colors"
      >
        {/* Icon — absolutely positioned, always centered */}
        <div ref={iconRef} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <Icon className="h-4 w-4 text-text-tertiary" />
        </div>

        {/* Floating label — in outer wrapper so it can float above the border */}
        <label
          ref={labelRef}
          className={`absolute z-10 pointer-events-none transition-all duration-300 ease-out ${
            isActive
              ? 'text-[11px] left-3 -top-2.5 text-primary font-medium scale-[0.92] origin-left bg-bg-card px-1'
              : 'text-sm left-10 top-1/2 -translate-y-1/2 text-text-tertiary scale-100'
          }`}
        >
          {label}
        </label>

        {/* Input area — overflow-hidden clips the glow line to rounded corners */}
        <div className="relative overflow-hidden rounded-b-[11px]">
          {/* Bottom glow line */}
          <div
            ref={glowRef}
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-accent opacity-0 origin-center"
            style={{ transform: 'scaleX(0)' }}
          />

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
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors p-0.5 z-20"
            >
              {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
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

function RippleButton({ children, isLoading, disabled, className = '', ...props }) {
  const btnRef = useRef(null)
  const rippleRef = useRef(null)

  const handleClick = (e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.className = 'absolute rounded-full bg-white/25 pointer-events-none'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.width = '0px'
    ripple.style.height = '0px'
    btn.appendChild(ripple)

    gsap.to(ripple, {
      width: 300, height: 300, x: -150, y: -150, opacity: 0,
      duration: 0.6, ease: 'power2.out',
      onComplete: () => ripple.remove(),
    })
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`group/btn relative overflow-hidden ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Please wait...</span>
        </div>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </button>
  )
}

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth)
  const [show, setShow] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })

  const containerRef = useRef(null)
  const leftPanelRef = useRef(null)
  const cardRef = useRef(null)
  const cardBorderRef = useRef(null)
  const logoRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const featuresRef = useRef(null)
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
        .from(featuresRef.current?.children || [], { x: -30, opacity: 0, stagger: 0.12, duration: 0.4 }, '-=0.2')

      gsap.from(cardRef.current, {
        y: 60, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power2.out', delay: 0.3,
      })

      // Card border glow animation
      gsap.to(cardBorderRef.current, {
        backgroundPosition: '200% center',
        duration: 4,
        repeat: -1,
        ease: 'none',
      })

      const formFields = formRef.current?.querySelectorAll('.form-field') || []
      gsap.from(formFields, {
        y: 25, opacity: 0, stagger: 0.08, duration: 0.4, delay: 0.6, ease: 'power2.out',
      })

      if (dividerRef.current) {
        gsap.from(dividerRef.current, { scaleX: 0, opacity: 0, duration: 0.5, delay: 0.9, ease: 'power2.out' })
      }

      const orbs = orbsRef.current?.querySelectorAll('.orb') || []
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          y: `${20 + i * 10}`,
          x: `${10 + i * 5}`,
          duration: 3 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        })
        gsap.to(orb, {
          scale: 1 + i * 0.15,
          opacity: 0.5 + i * 0.1,
          duration: 2 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current,
        { x: -15, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
      )
    }
  }, [error])

  return (
    <div ref={containerRef} className="flex min-h-screen bg-bg-primary overflow-hidden">
      {/* ── LEFT PANEL ──────────────────────────── */}
      <div ref={leftPanelRef} className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-bg-primary to-accent/10" />

        <div ref={orbsRef} className="absolute inset-0 pointer-events-none">
          <div className="orb absolute top-[15%] left-[20%] w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="orb absolute top-[55%] right-[15%] w-56 h-56 rounded-full bg-accent/15 blur-3xl" />
          <div className="orb absolute bottom-[10%] left-[30%] w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 max-w-lg px-12">
          <div ref={logoRef} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-2xl shadow-primary/25">
            <Brain className="h-10 w-10 text-white" />
          </div>

          <div ref={titleRef}>
            <h1 className="text-5xl font-heading font-extrabold text-text-primary leading-tight">
              AssessAI
            </h1>
            <h2 className="mt-2 text-3xl font-heading font-bold text-text-primary">
              Smart Hiring Platform
            </h2>
          </div>

          <p ref={subtitleRef} className="mt-5 text-lg text-text-secondary leading-relaxed">
            AI-powered assessments with real-time proctoring, instant analytics, and intelligent question generation.
          </p>

          <div ref={featuresRef} className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ─────────────────── */}
      <div className="flex w-full lg:w-[45%] items-center justify-center px-6 py-12">
        <div ref={cardRef} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-text-primary">AssessAI</span>
          </div>

          {/* Animated border card */}
          <div className="relative rounded-2xl p-[1px] overflow-hidden">
            {/* Animated gradient border */}
            <div
              ref={cardBorderRef}
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #27272A, #4F46E5, #06B6D4, #27272A)',
                backgroundSize: '300% 300%',
              }}
            />

            <div className="relative rounded-2xl bg-bg-card p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-heading font-bold text-text-primary">Welcome back</h3>
                <p className="mt-1.5 text-sm text-text-secondary">Sign in to continue your assessment journey</p>
              </div>

              <form ref={formRef} onSubmit={handleSubmit((d) => dispatch(login(d)))} className="space-y-4">
                {error && (
                  <div ref={errorRef} className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-[10px] font-bold">!</span>
                    {error}
                  </div>
                )}

                <FloatingInput
                  label="Email address"
                  icon={Mail}
                  error={errors.email?.message}
                  registration={register('email')}
                  type="email"
                />

                <FloatingInput
                  label="Password"
                  icon={Lock}
                  error={errors.password?.message}
                  registration={register('password')}
                  showToggle
                  showState={show}
                  onToggleShow={() => setShow(!show)}
                />

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group/check">
                    <div className="relative">
                      <input
                        type="checkbox"
                        {...register('rememberMe')}
                        defaultChecked
                        className="peer sr-only"
                      />
                      <div className="h-4 w-4 rounded border border-border bg-bg-secondary peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <svg className="absolute top-0 left-0 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-text-secondary group-hover/check:text-text-primary transition-colors">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit button */}
                <div className="form-field pt-2">
                  <RippleButton
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Sign in
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </RippleButton>
                </div>
              </form>

              {/* Divider */}
              <div ref={dividerRef} className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-bg-card px-3 text-text-tertiary font-medium tracking-wider">or continue with</span>
                </div>
              </div>

              {/* Social login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary py-2.5 text-sm font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-light transition-all duration-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary py-2.5 text-sm font-medium text-text-primary hover:bg-bg-tertiary hover:border-border-light transition-all duration-200"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              {/* Footer links */}
              <div className="mt-7 pt-6 border-t border-border">
                <p className="text-center text-sm text-text-secondary">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary hover:text-primary-light transition-colors">
                    Sign up free
                  </Link>
                </p>
                <div className="mt-3 flex items-center justify-center gap-3 text-xs text-text-tertiary">
                  <Link to="/admin/login" className="hover:text-primary transition-colors">Admin login</Link>
                  <span className="text-border">·</span>
                  <Link to="/register/setter" className="hover:text-primary transition-colors">Setter registration</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
