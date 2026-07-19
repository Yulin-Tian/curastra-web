import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, ScanText, MessageCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button, ErrorBanner, inputClass } from '../components/ui'

const features = [
  { icon: ScanText, text: 'Scan a prescription and turn it into a clear care plan.' },
  { icon: ShieldCheck, text: 'You review and confirm every extracted word before AI touches it.' },
  { icon: MessageCircle, text: 'An assistant that knows your medicines, plan, and readings.' },
]

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
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-pine-900 p-12 text-white lg:flex lg:w-[44%]">
        <div className="anim-drift pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <HeartPulse className="h-8 w-8 text-teal-400" strokeWidth={1.8} />
          <span className="font-display text-2xl font-medium">Curastra</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-medium leading-[1.15]">
            Care shouldn't end
            <br />
            when the visit does.
          </h2>
          <ul className="mt-10 space-y-5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3.5 text-[15px] leading-relaxed text-sage-100/85">
                <span className="mt-0.5 rounded-lg bg-white/10 p-1.5">
                  <Icon className="h-4 w-4 text-teal-300" strokeWidth={1.8} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sage-200/50">
          Curastra supports everyday care. It never diagnoses or replaces medical advice.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-paper px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-teal-600" strokeWidth={1.8} />
              <span className="font-display text-2xl font-medium text-pine-900">Curastra</span>
            </Link>
          </div>
          <h1 className="font-display text-3xl font-medium text-pine-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-stone-500">Sign in to continue your care.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <ErrorBanner message={error} />
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
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full !py-3">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="pt-1 text-center text-sm text-stone-500">
              New here?{' '}
              <Link to="/register" className="font-medium text-teal-700 hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
