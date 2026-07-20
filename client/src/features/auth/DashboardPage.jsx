import { useAppSelector } from '@/hooks'
import CandidateDashboard from '@/features/dashboard/CandidateDashboard'
import SetterDashboard from '@/features/dashboard/SetterDashboard'
import { Navigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth)
  const role = user?.role || 'candidate'

  if (role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (role === 'setter') {
    return <SetterDashboard />
  }

  return <CandidateDashboard />
}
