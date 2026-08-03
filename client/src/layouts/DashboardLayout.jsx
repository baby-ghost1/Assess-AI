import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAppSelector } from '@/hooks'
import { useState } from 'react'
import MiniPlayer from '@/features/vibes/MiniPlayer'
import AppLoader from '@/components/shared/AppLoader'

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return <AppLoader text="Preparing dashboard..." userId={user?._id} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen((p) => !p)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
      <MiniPlayer />
    </div>
  )
}
