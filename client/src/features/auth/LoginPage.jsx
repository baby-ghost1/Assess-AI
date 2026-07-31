import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { login, clearError } from './authSlice'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Sparkles, Zap, Shield, Globe, ChevronRight } from 'lucide-react'
import gsap from 'gsap'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  rememberMe: z.boolean().optional().default(true),
})

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function FloatingInput({ label, icon: Icon, error, registration, type, showToggle, showState, onToggleShow, autoFocus, index = 0 }) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const wrapperRef = useRef(null)
  const labelRef = useRef(null)
  const lineRef = useRef(null)

  const isActive = focused || hasValue

  useEffect(() => {
    if (wrapperRef.current?.querySelector('input')?.value) setHasValue(true)
  }, [])

  return (
    <div className="group relative" style={{ '--i': index }}>
      <div
        ref={wrapperRef}
        className={`relative rounded-2xl border-2 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 ${
          error ? 'border-red-500/50' : focused ? 'border-violet-500/60' : 'border-white/10'
        } ${focused ? 'shadow-lg shadow-violet-500/10' : ''}`}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-300" style={{ color: focused ? '#8B5CF6' : 'rgba(255,255,255,0.3)' }}>
          <Icon className="h-4 w-4" />
        </div>

        <label
          ref={labelRef}
          className={`absolute z-10 pointer-events-none transition-all duration-300 origin-left ${
            isActive
              ? 'text-[10px] left-4 -top-2.5 font-semibold tracking-wide uppercase px-2'
              : 'text-sm left-11 top-1/2 -translate-y-1/2'
          } ${focused ? 'text-violet-400' : error ? 'text-red-400' : 'text-white/40'}`}
        >
          {label}
        </label>

        <div className="relative overflow-hidden rounded-[14px]">
          <div
            ref={lineRef}
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 transition-all duration-500"
            style={{ opacity: focused ? 1 : 0 }}
          />
          <input
            type={showToggle ? (showState ? 'text' : 'password') : type || 'text'}
            autoFocus={autoFocus}
            {...registration}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); setHasValue(e.target.value.length > 0) }}
            onChange={(e) => { registration.onChange(e); setHasValue(e.target.value.length > 0) }}
            className="w-full bg-transparent py-3.5 pl-11 pr-11 text-sm text-white/90 outline-none placeholder-transparent font-medium"
            placeholder={label}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-all duration-200 p-1 rounded-lg hover:bg-white/5"
            >
              {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      <div className="h-5 overflow-hidden pt-1">
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 animate-slideDown font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400/80 shrink-0 animate-pulse" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function MagneticButton({ children, className = '', disabled, isLoading, ...props }) {
  const btnRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setPosition({ x: x * 0.3, y: y * 0.3 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
  }, [])

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || isLoading}
      className={`group relative overflow-hidden rounded-2xl font-semibold transition-all duration-200 ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
      <div className="relative z-10 flex items-center justify-center gap-2 px-6 py-3.5">
        {isLoading ? (
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm">Signing in...</span>
          </div>
        ) : (
          <>
            <span className="text-sm">{children}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 group-hover:-translate-y-0.5 transition-all duration-300" />
          </>
        )}
      </div>
    </button>
  )
}

function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    const count = 60

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.3 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${p.a})`
        ctx.fill()

        particles.forEach((p2) => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })

  const containerRef = useRef(null)
  const cardRef = useRef(null)
  const glowRef = useRef(null)
  const formRef = useRef(null)
  const errorRef = useRef(null)
  const dividerRef = useRef(null)
  const socialRef = useRef(null)
  const footerRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError) dispatch(login.rejected({ payload: decodeURIComponent(authError) }))
  }, [searchParams, dispatch])

  useEffect(() => { if (isAuthenticated) navigate('/dashboard') }, [isAuthenticated, navigate])
  useEffect(() => () => dispatch(clearError()), [dispatch])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { y: 40, opacity: 0, scale: 0.97 })
      gsap.set(formRef.current?.children || [], { y: 20, opacity: 0 })
      gsap.set(dividerRef.current, { scaleX: 0, opacity: 0 })
      gsap.set(socialRef.current?.children || [], { y: 15, opacity: 0 })
      gsap.set(footerRef.current, { y: 10, opacity: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.to(cardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' })
        .to(formRef.current?.children || [], { y: 0, opacity: 1, stagger: 0.06, duration: 0.5 }, '-=0.4')
        .to(dividerRef.current, { scaleX: 1, opacity: 1, duration: 0.5 }, '-=0.2')
        .to(socialRef.current?.children || [], { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 }, '-=0.3')
        .to(footerRef.current, { y: 0, opacity: 1, duration: 0.3 }, '-=0.1')
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current, { x: -15, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
      gsap.fromTo(cardRef.current, { x: -4 },
        { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.2)' })
    }
  }, [error])

  useEffect(() => {
    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          left: `${e.clientX - 150}px`,
          top: `${e.clientY - 150}px`,
          duration: 1.5,
          ease: 'power2.out',
        })
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#0A0A0F] overflow-hidden flex items-center justify-center select-none py-16">
      <ParticleField />

      {/* Animated gradient background */}
      <div className="fixed inset-0 z-[1]">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-fuchsia-950/40" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[120px] animate-[float_8s_ease-in-out_infinite_2s]" />
        <div ref={glowRef} className="absolute w-[300px] h-[300px] rounded-full bg-violet-500/8 blur-[100px] pointer-events-none transition-all duration-1000" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 z-[1] opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Decorative rings */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 border border-violet-500/10 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none z-[1]" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 border border-fuchsia-500/10 rounded-full animate-[spin_20s_linear_infinite_reverse] pointer-events-none z-[1]" />

      {/* Main Card */}
      <div ref={cardRef} className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-500/30 mb-5 animate-[float_4s_ease-in-out_infinite]">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-logo font-normal text-text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] drop-shadow-[0_0_20px_rgba(139,92,246,0.35)] drop-shadow-[0_0_45px_rgba(139,92,246,0.25)]">
            AssessAI
          </h1>
          <p className="mt-2 text-sm text-white/40 font-medium tracking-wide">
            Welcome back to the future of assessments
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl p-[1.5px] overflow-hidden">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/40 via-fuchsia-500/20 to-violet-500/40 animate-[spin_4s_linear_infinite]" style={{ filter: 'blur(1px)' }} />
          <div className="absolute inset-[1.5px] rounded-3xl bg-[#0E0E16] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          </div>
          <div className="relative rounded-3xl bg-gradient-to-b from-[#12121D] to-[#0A0A0F] backdrop-blur-2xl p-8">
            <form ref={formRef} onSubmit={handleSubmit((d) => dispatch(login(d)))} className="space-y-2">
              <div className="mb-6">
                <h2 className="text-xl font-heading font-bold text-white/90">Sign In</h2>
                <p className="text-sm text-white/30 mt-1">Enter your credentials to continue</p>
              </div>

              {error && (
                <div ref={errorRef} className="flex items-center gap-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold">!</div>
                  {error}
                </div>
              )}

              <FloatingInput label="Email Address" icon={Mail} error={errors.email?.message} registration={register('email')} type="email" autoFocus index={0} />
              <FloatingInput label="Password" icon={Lock} error={errors.password?.message} registration={register('password')} showToggle showState={showPass} onToggleShow={() => setShowPass(!showPass)} index={1} />

              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group/check">
                  <div className="relative">
                    <input type="checkbox" {...register('rememberMe')} defaultChecked className="peer sr-only" />
                    <div className="h-4.5 w-4.5 rounded-md border border-white/20 bg-white/5 peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 peer-checked:border-transparent transition-all duration-200 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-xs text-white/40 group-hover/check:text-white/60 transition-colors font-medium">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium flex items-center gap-1">
                  Forgot password? <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <MagneticButton type="submit" isLoading={isLoading} disabled={isLoading} className="w-full">
                Sign In
              </MagneticButton>
            </form>

            {/* Divider */}
            <div ref={dividerRef} className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 bg-[#0E0E16]">or continue with</span>
              </div>
            </div>

            {/* Social */}
            <div ref={socialRef} className="grid grid-cols-2 gap-3">
              <a
                href={`${API_BASE}/auth/google`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white/60 hover:text-white transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/5 to-fuchsia-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </span>
              </a>
              <a
                href={`${API_BASE}/auth/github`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white/60 hover:text-white transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/0 via-fuchsia-600/5 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </span>
              </a>
            </div>

            {/* Footer */}
            <div ref={footerRef} className="mt-6 pt-5 border-t border-white/5">
              <p className="text-center text-sm text-white/30">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors relative group/link">
                  Sign Up
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-violet-400 to-fuchsia-400 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Features strip */}
        <div className="flex justify-center gap-6 mt-8">
          {[
            { icon: Zap, label: 'AI Powered' },
            { icon: Shield, label: 'Secure' },
            { icon: Globe, label: 'Global' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/20 group">
              <Icon className="h-3.5 w-3.5 group-hover:text-violet-400 transition-colors duration-300" />
              <span className="text-[11px] font-medium tracking-wide group-hover:text-white/40 transition-colors duration-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
