import { useState } from 'react'
import { BadgeCheck, Link2, UserRound } from 'lucide-react'
import { api } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ErrorBanner, PageTitle, inputClass } from '../components/ui'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [abhaNumber, setAbhaNumber] = useState('')
  const [abhaAddress, setAbhaAddress] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null

  async function onLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post<User>('/api/abha/link', { abha_number: abhaNumber, abha_address: abhaAddress })
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Linking failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onUnlink() {
    setError('')
    try {
      await api.post('/api/abha/unlink')
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlinking failed.')
    }
  }

  return (
    <div>
      <PageTitle title="Profile" subtitle="Your account and health ID." />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-teal-50 p-3">
            <UserRound className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-semibold text-slate-800">
          <Link2 className="h-4 w-4 text-teal-600" /> ABHA Health ID
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Link your Ayushman Bharat Health Account to carry your records across providers.
          (Demonstration flow — production would verify through the ABDM sandbox.)
        </p>

        {user.abha_linked ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-emerald-800">
                  Linked · {user.abha_number?.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
                </div>
                <div className="text-xs text-emerald-700">{user.abha_address}</div>
              </div>
            </div>
            <Button variant="secondary" onClick={onUnlink} className="mt-3">
              Unlink
            </Button>
          </div>
        ) : (
          <form onSubmit={onLink} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">ABHA number</label>
              <input
                required
                className={inputClass}
                placeholder="14-digit number"
                value={abhaNumber}
                onChange={(e) => setAbhaNumber(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">ABHA address</label>
              <input
                required
                className={inputClass}
                placeholder="yourname@abdm"
                value={abhaAddress}
                onChange={(e) => setAbhaAddress(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Linking…' : 'Link ABHA'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
