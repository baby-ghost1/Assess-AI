import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { adminLogin, clearError } from './authSlice'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Eye, EyeOff, Brain } from 'lucide-react'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
})

export default function AdminLoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, error, user } = useAppSelector((s) => s.auth)
  const [show, setShow] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') navigate('/admin')
    else if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate, user])
  useEffect(() => () => dispatch(clearError()), [dispatch])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-danger to-red-700 shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 text-2xl font-heading font-bold text-text-primary">Admin Login</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-2 text-sm text-text-secondary">Secure admin panel access</motion.p>
          </div>

          <form onSubmit={handleSubmit((d) => dispatch(adminLogin(d)))} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input {...register('email')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent transition-all" placeholder="admin@assessai.com" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input type={show ? 'text' : 'password'} {...register('password')} className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('rememberMe')} defaultChecked className="h-4 w-4 rounded border-border bg-bg-secondary text-danger focus:ring-danger focus:ring-offset-0 cursor-pointer" />
                <span className="text-sm text-text-secondary">Remember me for 30 days</span>
              </label>
            </div>

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }} className="w-full rounded-lg bg-gradient-to-r from-danger to-red-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg">
              {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary"><Link to="/login" className="text-primary hover:text-primary-light font-medium">Back to user login</Link></p>
        </div>
      </motion.div>
    </div>
  )
}
