import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorBanner, inputClass } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <HeartPulse className="h-10 w-10 text-teal-600" />
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Curastra</h1>
          <p className="text-sm text-slate-500">Your everyday care companion</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ErrorBanner message={error} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-medium text-teal-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
