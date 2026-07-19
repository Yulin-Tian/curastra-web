import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorBanner, inputClass } from '../components/ui'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-pine-900 p-12 text-white lg:flex lg:w-[44%]">
        <div className="flex items-center gap-2.5">
          <HeartPulse className="h-8 w-8 text-teal-400" strokeWidth={1.8} />
          <span className="font-display text-2xl font-medium">Curastra</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-medium leading-[1.15]">
            Your care,
            <br />
            clearly organised.
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-sage-100/85">
            Prescriptions, care plans, medicines, and readings — kept in one calm place, with an
            assistant that understands them.
          </p>
        </div>
        <p className="text-xs text-sage-200/50">
          Curastra supports everyday care. It never diagnoses or replaces medical advice.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-paper px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-teal-600" strokeWidth={1.8} />
              <span className="font-display text-2xl font-medium text-pine-900">Curastra</span>
            </div>
          </div>
          <h1 className="font-display text-3xl font-medium text-pine-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-stone-500">Keep your care on track after every visit.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <ErrorBanner message={error} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pine-900">Full name</label>
              <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pine-900">Email</label>
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
              <label className="mb-1.5 block text-sm font-medium text-pine-900">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-xs text-stone-400">At least 8 characters.</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full !py-3">
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="pt-1 text-center text-sm text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-700 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
