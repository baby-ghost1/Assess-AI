import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Brain, Sparkles, BarChart3, Trophy, Shield, Users, Settings, ChevronLeft, BookOpen, ClipboardCheck, FileEdit, LogOut, Zap, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { logout } from '@/features/auth/authSlice'

function sidebarItems(role) {
  if (role === 'admin') {
    return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/question-bank', icon: BookOpen, label: 'Question Bank' },
      { to: '/question-bank/ai-generate', icon: Sparkles, label: 'AI Generate' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
      { to: '/admin', icon: Shield, label: 'Admin Panel' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }

  if (role === 'setter') {
    return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/question-bank', icon: BookOpen, label: 'Question Bank' },
      { to: '/question-bank/ai-generate', icon: Sparkles, label: 'AI Generate' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
      { to: '/assessments/create', icon: FileEdit, label: 'Create Assessment' },
      { to: '/question-bank/approval-queue', icon: ClipboardCheck, label: 'Approvals' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }

  return [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ai-quiz', icon: Zap, label: 'AI Quiz' },
    { to: '/coding', icon: Code2, label: 'Coding' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/assessments', icon: Brain, label: 'Assessments' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role || 'candidate'
  const items = sidebarItems(role)

  return (
    <aside className={cn('flex flex-col border-r border-border bg-bg-secondary transition-all duration-300', collapsed ? 'w-[72px]' : 'w-[187px]')}>
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"><Brain className="h-5 w-5 text-white" /></div>
        {!collapsed && <span className="font-heading text-lg font-bold text-text-primary">AssessAI</span>}
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200', isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary')}>
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <button onClick={() => { dispatch(logout()); navigate('/login') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-danger transition-colors duration-200">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors duration-200">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
