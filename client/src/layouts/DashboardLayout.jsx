import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAppSelector } from '@/hooks'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Brain } from 'lucide-react'

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
        <footer className="border-t border-border bg-bg-card/50 px-6 py-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span>&copy; 2026 AssessAI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
              <a href="#" className="hover:text-text-secondary transition-colors">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
