import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks'
import { oauthCallback } from '@/features/auth/authSlice'
import { Loader2 } from 'lucide-react'

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

  return (
    <div className="flex min-h-screen bg-bg-primary items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-text-secondary">Completing authentication...</p>
      </div>
    </div>
  )
}
