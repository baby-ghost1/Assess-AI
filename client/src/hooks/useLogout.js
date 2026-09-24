import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks'
import { logout } from '@/features/auth/authSlice'
import { useMusicPlayer } from '@/features/vibes/musicPlayerContext'

export default function useLogout() {
  const [showConfirm, setShowConfirm] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { stop } = useMusicPlayer()

  const confirmLogout = useCallback(() => {
    stop()
    dispatch(logout())
    navigate('/login')
    setShowConfirm(false)
  }, [stop, dispatch, navigate])

  const requestLogout = useCallback(() => setShowConfirm(true), [])
  const cancelLogout = useCallback(() => setShowConfirm(false), [])

  return { showConfirm, requestLogout, confirmLogout, cancelLogout }
}
