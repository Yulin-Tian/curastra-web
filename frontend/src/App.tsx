import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import LoginPage from './pages/LoginPage'
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route path="/" element={<DashboardPage />} />
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
  )
}
