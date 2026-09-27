import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks'
import { logout } from '@/features/auth/authSlice'
import { useMusicPlayer } from '@/features/vibes/musicPlayerContext'

export default function useLogout() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { stop } = useMusicPlayer()

  // Wait for the logout state to clear BEFORE navigating — otherwise /login
  // still sees an authenticated user and bounces straight back to the dashboard.
  const confirmLogout = useCallback(async () => {
    if (isPending) return
    setIsPending(true)
    stop()
    try {
      await dispatch(logout()).unwrap()
    } catch {
      // the thunk never rejects, but stay safe so the dialog can't get stuck
    } finally {
      setIsPending(false)
      setShowConfirm(false)
      navigate('/login', { replace: true })
    }
  }, [isPending, stop, dispatch, navigate])

  const requestLogout = useCallback(() => setShowConfirm(true), [])
  const cancelLogout = useCallback(() => {
    if (!isPending) setShowConfirm(false)
  }, [isPending])

  return { showConfirm, isPending, requestLogout, confirmLogout, cancelLogout }
}
