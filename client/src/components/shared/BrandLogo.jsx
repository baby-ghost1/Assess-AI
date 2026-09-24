import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function BrandLogo({ className = '' }) {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const siteName = data?.data?.siteName || 'AssessAI'

  return (
    <span className={`relative inline-block font-logo text-text-primary logo-glow ${className}`}>
      {siteName}
    </span>
  )
}
