import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, KeyRound } from 'lucide-react'
import { api } from '../api/client'
import { useLang } from '../i18n/LanguageContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Button, ErrorBanner, inputClass } from '../components/ui'

export default function ForgotPasswordPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [devCode, setDevCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await api.post<{ ok: boolean; dev_code?: string }>('/api/auth/forgot', { email })
      setDevCode(res.dev_code ?? '')
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.')
    } finally {
      setBusy(false)
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/auth/reset', { email, code, new_password: newPassword })
      navigate('/login', { state: { resetDone: true } })
      window.alert(t('fp.success'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-teal-600" strokeWidth={1.8} />
          <span className="font-display text-2xl font-medium text-pine-900">Curastra</span>
        </Link>
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-medium text-pine-900">
          <KeyRound className="h-6 w-6 text-teal-600" /> {t('fp.title')}
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">{t('fp.sub')}</p>

        {step === 1 ? (
          <form onSubmit={onRequest} className="mt-8 space-y-4">
            <ErrorBanner message={error} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pine-900">{t('auth.email')}</label>
              <input
                type="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full !py-3">
              {busy ? t('fp.sending') : t('fp.sendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onReset} className="mt-8 space-y-4">
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">{t('fp.codeSent')}</p>
            {devCode && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t('fp.devCode')} <strong className="tracking-[0.2em]">{devCode}</strong>
              </p>
            )}
            <ErrorBanner message={error} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pine-900">{t('fp.code')}</label>
              <input
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                className={`${inputClass} text-center tracking-[0.3em]`}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <p className="mt-1.5 text-xs text-stone-400">{t('fp.codeValid')}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pine-900">{t('acct.newPassword')}</label>
              <input
                type="password"
                required
                minLength={10}
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-stone-400">{t('auth.pwHint')}</p>
              <p className="mt-1.5 text-xs text-stone-400">{t('reg.minChars')}</p>
            </div>
            <Button type="submit" disabled={busy || code.length !== 6} className="w-full !py-3">
              {busy ? t('fp.resetting') : t('fp.resetBtn')}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link to="/login" className="font-medium text-teal-700 hover:underline">
            {t('fp.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
