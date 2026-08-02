import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { applyTheme, getStoredTheme } from './api/client'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import Layout from './components/Layout'
import { ColdStartNotice } from './components/ColdStartNotice'
import { Spinner } from './components/ui'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import RecordsPage from './pages/RecordsPage'
import RecordDetailPage from './pages/RecordDetailPage'
import CarePlansPage from './pages/CarePlansPage'
import CarePlanDetailPage from './pages/CarePlanDetailPage'
import MedicationsPage from './pages/MedicationsPage'
import VitalsPage from './pages/VitalsPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  )
}
