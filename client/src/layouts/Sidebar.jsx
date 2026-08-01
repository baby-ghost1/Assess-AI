import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Brain, BarChart3, Trophy, Shield, Users, Settings, ChevronLeft, BookOpen, ClipboardCheck, FileEdit, LogOut, Zap, Code2, X, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/shared'
import { useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
import { logout } from '@/features/auth/authSlice'
import api from '@/lib/api'

const sidebarConfig = {
  admin: [
    { section: 'Main', items: [
      { to: '/admin', icon: Shield, label: 'Admin Panel', end: true },
    ]},
    { section: 'Reviews', items: [
      { to: '/admin/reviews', icon: ClipboardCheck, label: 'Review Queue' },
    ]},
    { section: 'Manage', items: [
      { to: '/assessments', icon: Brain, label: 'Assessments' },
      { to: '/users', icon: Users, label: 'Users' },
    ]},
    { section: 'Insights', items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics', end: true },
      { to: '/admin/analytics', icon: Shield, label: 'Platform Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ]},
    { section: 'System', items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]},
    { section: 'Chill Zone', items: [
      { to: '/vibes', icon: Music, label: 'Vibes', badge: 'New' },
    ]},
  ],
  setter: [
    { section: 'Main', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { section: 'Create', items: [
      { to: '/question-bank', icon: BookOpen, label: 'Question Bank' },
      { to: '/assessments', icon: Brain, label: 'Assessments', end: true },
      { to: '/assessments/create', icon: FileEdit, label: 'Create Assessment' },
    ]},
    { section: 'Insights', items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ]},
    { section: 'System', items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]},
    { section: 'Chill Zone', items: [
      { to: '/vibes', icon: Music, label: 'Vibes', badge: 'New' },
    ]},
  ],
  candidate: [
    { section: 'Main', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { section: 'Learn', items: [
      { to: '/ai-quiz', icon: Zap, label: 'AI Quiz', badge: 'Hot' },
      { to: '/coding', icon: Code2, label: 'Coding' },
      { to: '/assessments', icon: Brain, label: 'Assessments' },
    ]},
    { section: 'Insights', items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ]},
    { section: 'System', items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]},
    { section: 'Chill Zone', items: [
      { to: '/vibes', icon: Music, label: 'Vibes', badge: 'New' },
    ]},
  ],
}

function getActiveLabel(pathname, sections) {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.to === pathname) return item.label
      if (pathname.startsWith(item.to + '/')) return item.label
    }
  }
  return ''
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role || 'candidate'

  const { data: pendingAssessData } = useQuery({
    queryKey: ['sidebar-pending-assessment-count'],
    queryFn: () => api.get('/assessments/my?status=pending_approval&limit=1').then((r) => r.data),
    enabled: role === 'setter',
    refetchInterval: 60000,
  })

  const { data: adminPendingAssessData } = useQuery({
    queryKey: ['sidebar-admin-pending-assessment-count'],
    queryFn: () => api.get('/admin/assessments/pending').then((r) => r.data),
    enabled: role === 'admin',
    refetchInterval: 60000,
  })

  const pendingAssessCount = role === 'setter' ? (pendingAssessData?.meta?.total || 0) : 0
  const adminPendingAssessCount = role === 'admin' ? (adminPendingAssessData?.data?.length || 0) : 0

  const baseSections = sidebarConfig[role] || sidebarConfig.candidate
  const sections = role === 'setter'
    ? baseSections.map((s) => ({
        ...s,
        items: s.items.map((item) => {
          if (item.to === '/assessments' && pendingAssessCount > 0) {
            return { ...item, badge: String(pendingAssessCount) }
          }
          return item
        }),
      }))
    : role === 'admin'
    ? baseSections.map((s) => ({
        ...s,
        items: s.items.map((item) => {
          if (item.to === '/admin/reviews' && adminPendingAssessCount > 0) {
            return { ...item, badge: String(adminPendingAssessCount) }
          }
          return item
        }),
      }))
    : baseSections

  const activeLabel = getActiveLabel(location.pathname, sections)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setCollapsed((p) => !p) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const lastPathRef = useRef(location.pathname)

  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname
      onMobileClose?.()
    }
  }, [location.pathname, onMobileClose])

  const sidebarContent = (
    <aside className={cn(
      'relative flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full',
      collapsed ? 'w-[72px]' : 'w-[220px]'
    )}
      style={{
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, color-mix(in srgb, var(--color-bg-secondary) 95%, var(--color-primary)) 100%)'
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0 shadow-lg shadow-primary/20">
          <Brain className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <BrandLogo className="text-lg leading-tight" />
            <span className="text-[9px] text-text-tertiary leading-tight capitalize">{role}</span>
          </div>
        )}
      </div>

      {/* Current page label when collapsed */}
      {collapsed && activeLabel && (
        <div className="px-2 pt-3 pb-1 text-center">
          <span className="text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">{activeLabel}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
        {sections.map((section, si) => (
          <div key={section.section} className={cn(si > 0 && 'mt-3')}>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{section.section}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {collapsed && si > 0 && <div className="mx-auto w-6 h-px bg-border my-2" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <TooltipWrapper key={item.to} label={item.label} collapsed={collapsed}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_6px_var(--color-primary)]" />
                        )}
                        {/* Icon with glow on active */}
                        <div className={cn(
                          'relative flex items-center justify-center rounded-md transition-all duration-200',
                          isActive && 'drop-shadow-[0_0_4px_var(--color-primary)]',
                          !collapsed && 'h-5 w-5',
                          collapsed && 'h-6 w-6'
                        )}>
                          <item.icon className={cn(
                            'shrink-0 transition-all duration-200',
                            isActive ? 'h-5 w-5' : 'h-4.5 w-4.5 group-hover:h-5 group-hover:w-5',
                          )} />
                        </div>
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge && (
                              <span className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                                item.badge === 'New' ? 'bg-primary/20 text-primary' :
                                item.badge === 'Hot' ? 'bg-amber-500/20 text-amber-500' :
                                'bg-danger/20 text-danger'
                              )}>{item.badge}</span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                </TooltipWrapper>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        {/* User card */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-bg-tertiary/50 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 ring-1 ring-primary/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-text-primary truncate leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] text-text-tertiary truncate leading-tight">{user?.email || ''}</span>
            </div>
          </div>
        ) : (
          <TooltipWrapper label={user?.name || 'User'} collapsed={collapsed}>
            <button onClick={() => navigate('/profile')} className="flex w-full justify-center py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold ring-1 ring-primary/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>
          </TooltipWrapper>
        )}

        {/* Logout */}
        <TooltipWrapper label="Logout" collapsed={collapsed}>
          <button onClick={() => { dispatch(logout()); navigate('/login') }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-danger/10 hover:text-danger transition-all duration-200',
              collapsed && 'justify-center px-0'
            )}>
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </TooltipWrapper>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary transition-all duration-200">
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative h-full w-[220px] flex">
            {sidebarContent}
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-2 p-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function TooltipWrapper({ label, collapsed, children }) {
  const [show, setShow] = useState(false)
  if (!collapsed) return children
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-xs font-medium text-text-primary shadow-xl whitespace-nowrap pointer-events-none">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-bg-elevated" />
        </div>
      )}
    </div>
  )
}
