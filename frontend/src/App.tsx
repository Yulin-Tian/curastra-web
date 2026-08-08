import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { applyTheme, getStoredTheme } from './api/client'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import Layout from './components/Layout'
import { ColdStartNotice } from './components/ColdStartNotice'
import { Spinner } from './components/ui'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Everything beyond the entry pages is code-split: each route loads its own
// chunk on first visit, keeping the initial bundle lean.
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const RecordsPage = lazy(() => import('./pages/RecordsPage'))
const RecordDetailPage = lazy(() => import('./pages/RecordDetailPage'))
const CarePlansPage = lazy(() => import('./pages/CarePlansPage'))
const CarePlanDetailPage = lazy(() => import('./pages/CarePlanDetailPage'))
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'))
const VitalsPage = lazy(() => import('./pages/VitalsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const SharedViewPage = lazy(() => import('./pages/SharedViewPage'))
const PrivacyPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.TermsPage })))

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  // Family-profile theme is applied before first paint (no flash of pine
  // while caring for a child).
  applyTheme(getStoredTheme())
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <ColdStartNotice />
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <Spinner label="Loading…" />
            </div>
          }
        >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/share/:token" element={<SharedViewPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/records/:id" element={<RecordDetailPage />} />
            <Route path="/care-plans" element={<CarePlansPage />} />
            <Route path="/care-plans/:id" element={<CarePlanDetailPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/vitals" element={<VitalsPage />} />
            <Route path="/assistant" element={<ChatPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  )
}
