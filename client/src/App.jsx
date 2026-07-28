import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { store } from '@/store'
import { ErrorBoundary, OfflineOverlay, SlowInternetWarning, SessionExpiredModal, NotFoundPage } from '@/components/shared'
import { lazy, Suspense, useEffect, useState } from 'react'
import { setTheme } from '@/store/themeSlice'
import { getCurrentUser } from '@/features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { Loader2 } from 'lucide-react'

import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import AdminLoginPage from '@/features/auth/AdminLoginPage'
import SetterRegisterPage from '@/features/auth/SetterRegisterPage'

const DashboardPage = lazy(() => import('@/features/auth/DashboardPage'))
const QuestionBankPage = lazy(() => import('@/features/question-bank/QuestionBankPage'))
const QuestionFormPage = lazy(() => import('@/features/question-bank/QuestionFormPage'))
const QuestionDetailPage = lazy(() => import('@/features/question-bank/QuestionDetailPage'))
const ImportPage = lazy(() => import('@/features/question-bank/ImportPage'))
const AIGeneratePage = lazy(() => import('@/features/question-bank/AIGeneratePage'))
const ApprovalQueuePage = lazy(() => import('@/features/question-bank/ApprovalQueuePage'))
const AssessmentsPage = lazy(() => import('@/features/assessments/AssessmentsPage'))
const AssessmentCreatePage = lazy(() => import('@/features/assessments/AssessmentCreatePage'))
const AssessmentPreviewPage = lazy(() => import('@/features/assessments/AssessmentPreviewPage'))
const AssessmentReviewPage = lazy(() => import('@/features/assessments/AssessmentReviewPage'))
const AssessmentReviewDetailPage = lazy(() => import('@/features/assessments/AssessmentReviewDetailPage'))
const QuizAttemptPage = lazy(() => import('@/features/assessments/QuizAttemptPage'))
const ResultsPage = lazy(() => import('@/features/assessments/ResultsPage'))
const MyAttemptsPage = lazy(() => import('@/features/assessments/MyAttemptsPage'))
const ProctoringDashboard = lazy(() => import('@/features/proctoring/ProctoringDashboard'))
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'))
const AdminAnalyticsPage = lazy(() => import('@/features/analytics/AdminAnalyticsPage'))
const AssessmentAnalyticsPage = lazy(() => import('@/features/analytics/AssessmentAnalyticsPage'))
const AdminPage = lazy(() => import('@/features/admin/AdminPage'))
const CodingPage = lazy(() => import('@/features/coding/CodingPage'))
const AIQuizPage = lazy(() => import('@/features/ai-quiz/AIQuizPage'))
const LeaderboardPage = lazy(() => import('@/features/leaderboard/LeaderboardPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
  },
})

function ThemeInitializer({ children }) {
  const dispatch = useAppDispatch()
  const { mode } = useAppSelector((s) => s.theme)
  useEffect(() => { dispatch(setTheme(mode)) }, [dispatch, mode])
  return children
}

function AuthInitializer({ children }) {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser()).finally(() => setInitialized(true))
    } else {
      setInitialized(true)
    }
  }, [dispatch, isAuthenticated])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-text-secondary">Restoring session...</p>
        </div>
      </div>
    )
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/setter/register" element={<SetterRegisterPage />} />
          <Route path="/admin/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AdminLoginPage />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/question-bank" element={<QuestionBankPage />} />
          <Route path="/question-bank/create" element={<QuestionFormPage />} />
          <Route path="/question-bank/:id" element={<QuestionDetailPage />} />
          <Route path="/question-bank/:id/edit" element={<QuestionFormPage />} />
          <Route path="/question-bank/import" element={<ImportPage />} />
          <Route path="/question-bank/ai-generate" element={<AIGeneratePage />} />
          <Route path="/question-bank/approval-queue" element={<ApprovalQueuePage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/create" element={<AssessmentCreatePage />} />
          <Route path="/assessments/my-attempts" element={<MyAttemptsPage />} />
          <Route path="/assessments/:id/edit" element={<AssessmentCreatePage />} />
          <Route path="/assessments/:id/preview" element={<AssessmentPreviewPage />} />
          <Route path="/assessments/:id" element={<QuizAttemptPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/proctoring" element={<ProctoringDashboard />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/analytics/assessment/:id" element={<AssessmentAnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/reviews" element={<AssessmentReviewPage />} />
          <Route path="/admin/reviews/:id" element={<AssessmentReviewDetailPage />} />
          <Route path="/coding" element={<CodingPage />} />
          <Route path="/ai-quiz" element={<AIQuizPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeInitializer>
            <AuthInitializer>
              <ErrorBoundary>
                <AppRoutes />
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    className: 'font-sans text-sm',
                    style: {
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    },
                  }}
                />
                <OfflineOverlay />
                <SlowInternetWarning />
                <SessionExpiredModal />
              </ErrorBoundary>
            </AuthInitializer>
          </ThemeInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  )
}
