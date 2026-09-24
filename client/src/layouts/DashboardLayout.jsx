import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAppSelector } from '@/hooks'
import { useState, useEffect } from 'react'
import AppLoader from '@/components/shared/AppLoader'
import { AnimatePresence, motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const location = useLocation()

  // Hide sidebar/topbar while in fullscreen (e.g. proctored quiz)
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    sync()
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  if (isLoading) {
    return <AppLoader text="Preparing dashboard..." userId={user?._id} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary">
      {!isFullscreen && (
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      )}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isFullscreen && <Topbar onMenuToggle={() => setMobileMenuOpen((p) => !p)} />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
          <AnimatePresence>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
