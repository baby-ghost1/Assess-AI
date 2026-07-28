import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { adminLogin, clearError } from './authSlice'
import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Eye, EyeOff, Brain, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
})

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
      <div className="group relative rounded-xl border border-border bg-bg-secondary transition-all duration-300 focus-within:border-danger/50 focus-within:shadow-[0_0_0_1px_rgba(239,68,68,0.3)]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300 group-focus-within:scale-110"
          style={{ color: focused || hasValue ? '#EF4444' : '#71717A' }}>
          <Icon className="h-4 w-4" />
        </div>

        <label className={`absolute z-10 pointer-events-none transition-all duration-200 ease-out ${
          isActive
            ? 'text-[11px] left-3 -top-2.5 text-danger font-medium bg-bg-card px-1'
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
            autoComplete={type === 'password' ? 'current-password' : undefined}
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

export default function AdminLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error, user } = useAppSelector((s) => s.auth)
  const [show, setShow] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })
  const cardRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') navigate('/admin')
    else if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate, user])
  useEffect(() => () => dispatch(clearError()), [dispatch])

  const shake = error ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div
          ref={cardRef}
          animate={shake}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-danger to-red-700 shadow-lg shadow-danger/20"
            >
              <Shield className="h-7 w-7 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 text-2xl font-heading font-bold text-text-primary"
            >Admin Login</motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-sm text-text-secondary"
            >Secure admin panel access</motion.p>
          </div>

          <form onSubmit={handleSubmit((d) => dispatch(adminLogin(d)))} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  key="admin-error"
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <FloatingInput
              label="Admin Email"
              icon={Mail}
              error={errors.email?.message}
              registration={register('email')}
              type="email"
              autoFocus
            />

            <FloatingInput
              label="Admin Password"
              icon={Lock}
              error={errors.password?.message}
              registration={register('password')}
              type="password"
              showToggle
              showState={show}
              onToggleShow={() => setShow(!show)}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group/check">
                <div className="relative">
                  <input type="checkbox" {...register('rememberMe')} defaultChecked className="peer sr-only" />
                  <div className="h-4 w-4 rounded border border-border bg-bg-secondary peer-checked:bg-danger peer-checked:border-danger transition-all duration-200 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-text-secondary group-hover/check:text-text-primary transition-colors">Remember me for 30 days</span>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="w-full rounded-xl bg-gradient-to-r from-danger to-red-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-danger/25 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Admin Panel
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
            <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
              Back to user login
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  )
}
