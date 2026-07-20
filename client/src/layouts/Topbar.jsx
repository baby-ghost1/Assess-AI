import { useAppDispatch, useAppSelector } from '@/hooks'
import { toggleTheme } from '@/store/themeSlice'
import { logout } from '@/features/auth/authSlice'
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '@/features/notifications/notificationSlice'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Bell, LogOut, User, Settings, CheckCheck, Trash2, X, Shield, Key, BellOff, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const GRADIENT_VARIANTS = {
  mix: 'linear-gradient(90deg, transparent 0%, #F97316 10%, #EC4899 30%, #8B5CF6 50%, #EC4899 70%, #F97316 90%, transparent 100%)',
  single: 'linear-gradient(90deg, transparent 0%, #F97316 15%, #FB923C 35%, #FDBA74 50%, #FB923C 65%, #F97316 85%, transparent 100%)',
}

const TYPE_ICONS = {
  password_change: Key,
  assessment_completed: CheckCheck,
  result_published: Shield,
  account_update: User,
  system: Bell,
}

const TYPE_COLORS = {
  password_change: 'text-amber-500 bg-amber-500/10',
  assessment_completed: 'text-emerald-500 bg-emerald-500/10',
  result_published: 'text-blue-500 bg-blue-500/10',
  account_update: 'text-primary bg-primary/10',
  system: 'text-text-secondary bg-bg-tertiary',
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Topbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { mode } = useAppSelector((s) => s.theme)
  const { user } = useAppSelector((s) => s.auth)
  const { items: notifications, unreadCount, loading: notifLoading } = useAppSelector((s) => s.notifications)
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [variant, setVariant] = useState('mix')
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    dispatch(fetchNotifications())
    const interval = setInterval(() => dispatch(fetchNotifications()), 30000)
    return () => clearInterval(interval)
  }, [dispatch])

  function handleBellClick() {
    setNotifOpen(!notifOpen)
    if (!notifOpen) dispatch(fetchNotifications())
  }

  return (
    <header className="relative flex h-16 items-center justify-between bg-bg-card/80 backdrop-blur-xl px-6">
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: GRADIENT_VARIANTS[variant] }} />
      <div className="flex items-center gap-3">
        <button onClick={() => setVariant(variant === 'mix' ? 'single' : 'mix')}
          className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors cursor-pointer" title="Toggle border style">
          {variant === 'mix' ? 'Mix' : 'Orange'}
        </button>
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={handleBellClick} className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] rounded-xl border border-border bg-bg-card shadow-2xl z-50 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h4 className="text-sm font-heading font-semibold text-text-primary">Notifications</h4>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={() => dispatch(markAllAsRead())} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors" title="Mark all as read">
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={() => dispatch(deleteAllNotifications())} className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 px-2 py-1 rounded-lg hover:bg-danger/10 transition-colors" title="Delete all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-text-secondary">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
                    <BellOff className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICONS[n.type] || Bell
                    const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.system
                    return (
                      <div key={n._id} className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors ${!n.read ? 'bg-primary/5' : 'hover:bg-bg-tertiary/50'}`}>
                        <div className={`shrink-0 mt-0.5 rounded-lg p-1.5 ${colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                            {!n.read && <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-text-tertiary mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-0.5">
                          {!n.read && (
                            <button onClick={() => dispatch(markAsRead(n._id))} className="p-1 rounded text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors" title="Mark as read">
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => dispatch(deleteNotification(n._id))} className="p-1 rounded text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors" title="Delete">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={() => dispatch(toggleTheme())} className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setOpen(!open)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-bg-card p-2 shadow-xl z-50">
              <div className="border-b border-border px-3 py-2">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-secondary">{user?.email}</p>
              </div>
              <button onClick={() => { navigate('/profile'); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"><User className="h-4 w-4" /> Profile</button>
              <button onClick={() => { navigate('/settings'); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"><Settings className="h-4 w-4" /> Settings</button>
              <button onClick={() => { dispatch(logout()); navigate('/login') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"><LogOut className="h-4 w-4" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
