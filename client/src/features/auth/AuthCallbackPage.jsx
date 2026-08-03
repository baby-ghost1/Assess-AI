import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks'
import { oauthCallback } from '@/features/auth/authSlice'
import AppLoader from '@/components/shared/AppLoader'

export default function AuthCallbackPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const provider = searchParams.get('provider')
    const error = searchParams.get('error')

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    if (accessToken && provider) {
      dispatch(oauthCallback({ accessToken, provider }))
        .unwrap()
        .then(() => navigate('/dashboard', { replace: true }))
        .catch((err) => navigate(`/login?error=${encodeURIComponent(err)}`, { replace: true }))
    } else {
      navigate('/login', { replace: true })
    }
  }, [dispatch, navigate, searchParams])

  return <AppLoader text="Verifying credentials..." />
}
