import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { register as registerUser, clearError } from './authSlice'
import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Brain, FileEdit, CheckCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

function FloatingInput({ label, icon: Icon, error, registration, type, showToggle, showState, onToggleShow, autoFocus }) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef(null)

  const isActive = focused || hasValue

  useEffect(() => {
    if (inputRef.current?.value) setHasValue(true)
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  return (
    <div>
      <div className="group relative rounded-xl border border-border bg-bg-secondary transition-all duration-300 focus-within:border-accent/50 focus-within:shadow-[0_0_0_1px_rgba(6,182,212,0.3)]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300 group-focus-within:scale-110"
          style={{ color: focused || hasValue ? '#06B6D4' : '#71717A' }}>
          <Icon className="h-4 w-4" />
        </div>

        <label className={`absolute z-10 pointer-events-none transition-all duration-200 ease-out ${
          isActive
            ? 'text-[11px] left-3 -top-2.5 text-accent font-medium bg-bg-card px-1'
            : 'text-sm left-10 top-1/2 -translate-y-1/2 text-text-tertiary'
        }`}>
          {label}
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type={showToggle ? (showState ? 'text' : 'password') : type || 'text'}
            {...registration}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); setHasValue(e.target.value.length > 0) }}
            onChange={(e) => { registration.onChange(e); setHasValue(e.target.value.length > 0) }}
            className="w-full bg-transparent py-3 pl-10 pr-10 text-sm text-text-primary outline-none placeholder-transparent"
            placeholder={label}
          />

          {showToggle && (
            <button type="button" onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors p-0.5 z-20">
              {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="mt-1 ml-1 text-xs text-danger flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-danger shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

function PasswordStrength({ value }) {
  const passed = value ? PASSWORD_RULES.filter((r) => r.test(value)).length : 0
  const colors = ['bg-danger', 'bg-warning', 'bg-success']
  const labels = ['Weak', 'Fair', 'Strong']
  const labelColors = ['text-danger', 'text-warning', 'text-success']

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">Password strength</span>
        <span className={`text-[11px] font-semibold ${passed > 0 ? labelColors[passed - 1] : 'text-text-tertiary'}`}>
          {passed > 0 ? labels[passed - 1] : 'Not set'}
        </span>
      </div>

      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                value && i < passed ? colors[passed - 1] : ''
              }`}
              style={{ width: value && i < passed ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-0.5">
        {PASSWORD_RULES.map((rule) => {
          const checked = value && rule.test(value)
          return (
            <div key={rule.label} className="flex items-center gap-1.5">
              <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                checked ? 'bg-success/15' : 'bg-bg-tertiary'
              }`}>
                <CheckCircle
                  className={`h-2.5 w-2.5 transition-all duration-300 ${
                    checked ? 'text-success scale-100' : 'text-text-tertiary scale-75'
                  }`}
                />
              </div>
              <span className={`text-[11px] transition-colors duration-200 ${
                checked ? 'text-success' : 'text-text-tertiary'
              }`}>
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SuccessParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * -200 - 50,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 0.3,
    color: ['#22C55E', '#4F46E5', '#06B6D4', '#F59E0B'][Math.floor(Math.random() * 4)],
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

export default function SetterRegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth)
  const [show, setShow] = useState({ pass: false, confirm: false })
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema) })
  const passwordValue = watch('password', '')
  const nameValue = watch('name', '')
  const [registered, setRegistered] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => { if (isAuthenticated && !registered) navigate('/dashboard') }, [isAuthenticated, navigate, registered])
  useEffect(() => () => dispatch(clearError()), [dispatch])

  const onSubmit = async (d) => {
    const result = await dispatch(registerUser({ name: d.name, email: d.email, password: d.password, role: 'setter' }))
    if (result.meta.requestStatus === 'fulfilled') {
      setRegistered(true)
      setTimeout(() => setShowParticles(true), 100)
      setTimeout(() => setShowParticles(false), 2000)
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          className="w-full max-w-md relative"
        >
          {showParticles && <SuccessParticles />}
          <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-xl p-8 shadow-2xl text-center relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-emerald-600 shadow-lg shadow-success/20"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <UserPlus className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-2xl font-heading font-bold text-text-primary"
            >Registration successful!</motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-sm text-text-secondary"
            >Your setter account has been created. An admin will review and approve your account. Once approved, you will be able to create assessments.</motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                Go to login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple-700 shadow-lg shadow-accent/20"
            >
              <FileEdit className="h-7 w-7 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 text-2xl font-heading font-bold text-text-primary"
            >Setter Registration</motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-sm text-text-secondary"
            >Register as a content creator to build assessments</motion.p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  key="setter-error"
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <FloatingInput
                label="Full Name"
                icon={User}
                error={errors.name?.message}
                registration={register('name')}
                autoFocus
              />
              {nameValue && (
                <div className="mt-1 ml-1 flex justify-end">
                  <span className={`text-[10px] font-medium ${nameValue.length >= 2 ? 'text-success' : 'text-text-tertiary'}`}>
                    {nameValue.length}/50
                  </span>
                </div>
              )}
            </div>

            <FloatingInput
              label="Email"
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
              showState={show.pass}
              onToggleShow={() => setShow({ ...show, pass: !show.pass })}
            />

            <PasswordStrength value={passwordValue} />

            <FloatingInput
              label="Confirm Password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              registration={register('confirmPassword')}
              showToggle
              showState={show.confirm}
              onToggleShow={() => setShow({ ...show, confirm: !show.confirm })}
            />

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="w-full rounded-xl bg-gradient-to-r from-accent to-purple-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-accent/25 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Registering...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Register as Setter
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-sm text-text-secondary"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  )
}
