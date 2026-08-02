import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { BadgeCheck, BellRing, Camera, HeartPulse, KeyRound, Link2, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api, getActiveProfileId, getToken, switchProfile } from '../api/client'
import { disablePush, enablePush, pushSupported } from '../api/push'
import type { ProfileInfo } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ErrorBanner, PageTitle, Spinner, inputClass } from '../components/ui'

function AccountCard() {
  const { user, refreshUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Password change
  const [showPw, setShowPw] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')

  // 2FA
  const [qr, setQr] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [disablePw, setDisablePw] = useState('')
  const [showDisable, setShowDisable] = useState(false)

  const loadAvatar = useCallback(() => {
    fetch(api.fileUrl('/api/auth/avatar'), { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => setAvatarUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return b ? URL.createObjectURL(b) : null
      }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadAvatar()
  }, [loadAvatar])

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.postForm('/api/auth/avatar', form)
      loadAvatar()
      setInfo('Profile photo updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await api.post('/api/auth/change-password', { current_password: curPw, new_password: newPw })
      setCurPw('')
      setNewPw('')
      setShowPw(false)
      setInfo('Password changed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password.')
    } finally {
      setBusy(false)
    }
  }

  async function onStartTotp() {
    setError('')
    setInfo('')
    try {
      const res = await api.post<{ otpauth_uri: string }>('/api/auth/totp/setup')
      setQr(await QRCode.toDataURL(res.otpauth_uri, { width: 180, margin: 1 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA setup failed.')
    }
  }

  async function onEnableTotp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/auth/totp/enable', { code: totpCode })
      setQr(null)
      setTotpCode('')
      await refreshUser()
      setInfo('Two-factor authentication is on. You will need your authenticator app to sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable 2FA.')
    } finally {
      setBusy(false)
    }
  }

  async function onDisableTotp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/auth/totp/disable', { password: disablePw })
      setDisablePw('')
      setShowDisable(false)
      await refreshUser()
      setInfo('Two-factor authentication is off.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable 2FA.')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null
  return (
    <Card className="mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          title="Change profile photo"
          className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-teal-50"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="m-auto mt-4 h-8 w-8 text-teal-600" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-pine-950/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-slate-900">{user.name}</div>
          <div className="text-sm text-slate-500">{user.email}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowPw((v) => !v)}>
            <KeyRound className="h-3.5 w-3.5" /> Change password
          </Button>
          {user.totp_enabled ? (
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowDisable((v) => !v)}>
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> 2FA on
            </Button>
          ) : (
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={onStartTotp}>
              <ShieldCheck className="h-3.5 w-3.5" /> Set up 2FA
            </Button>
          )}
        </div>
      </div>

      {(info || error) && (
        <div className="mt-3">
          {error ? <ErrorBanner message={error} /> : <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">{info}</p>}
        </div>
      )}

      {showPw && (
        <form onSubmit={onChangePassword} className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
            <input type="password" required className={inputClass} value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input type="password" required minLength={8} className={inputClass} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button>
        </form>
      )}

      {qr && (
        <form onSubmit={onEnableTotp} className="mt-4 flex flex-col items-start gap-4 border-t border-slate-100 pt-4 sm:flex-row">
          <img src={qr} alt="Authenticator QR code" className="rounded-lg border border-slate-200" />
          <div className="flex-1">
            <p className="text-sm text-slate-600">
              Scan this with Google Authenticator, Microsoft Authenticator, or any TOTP app, then
              enter the 6-digit code it shows to switch on two-factor sign-in.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                required
                className={`${inputClass} !w-32 text-center tracking-[0.3em]`}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              />
              <Button type="submit" disabled={busy || totpCode.length !== 6}>Turn on 2FA</Button>
            </div>
          </div>
        </form>
      )}

      {showDisable && (
        <form onSubmit={onDisableTotp} className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm your password to turn 2FA off</label>
            <input type="password" required className={inputClass} value={disablePw} onChange={(e) => setDisablePw(e.target.value)} />
          </div>
          <Button variant="danger" type="submit" disabled={busy}>Turn off 2FA</Button>
        </form>
      )}
    </Card>
  )
}

function FamilyCard({
  profiles,
  refresh,
}: {
  profiles: ProfileInfo[]
  refresh: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('child')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const activeId = getActiveProfileId()

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/api/profiles', { name, relationship })
      setName('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the profile.')
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(p: ProfileInfo) {
    if (!window.confirm(`Remove ${p.name}'s profile?`)) return
    setError('')
    try {
      await api.delete(`/api/profiles/${p.id}`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the profile.')
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-800">
        <Users className="h-4 w-4 text-teal-600" /> Family profiles
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Manage care for the people who depend on you. Each family member keeps their own records,
        care plans, medicines, readings, and ABHA — and the app changes its colors to match who
        you are caring for.
      </p>
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      <ul className="mt-4 divide-y divide-slate-100">
        {profiles.map((p) => {
          const isActive = activeId ? String(p.id) === activeId : p.is_primary
          return (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  p.relationship === 'child'
                    ? 'bg-[#e7ecf8] text-[#27367a]'
                    : p.relationship === 'parent'
                      ? 'bg-[#efe7db] text-[#4a3242]'
                      : 'bg-sage-100 text-pine-900'
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800">
                  {p.name}
                  {p.is_primary && <span className="ml-1.5 text-xs text-stone-400">(you)</span>}
                </div>
                <div className="text-xs text-stone-400">
                  {p.relationship} {p.abha_linked ? '· ABHA linked' : '· no ABHA yet'}
                </div>
              </div>
              {isActive ? (
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  Active
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="!px-2.5 !py-1 text-xs"
                  onClick={() => switchProfile(p.id, p.relationship, p.is_primary)}
                >
                  Switch to
                </Button>
              )}
              {!p.is_primary && (
                <button
                  onClick={() => onRemove(p)}
                  title="Remove profile"
                  className="rounded p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <form onSubmit={onAdd} className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amma" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">They are my</label>
          <select className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
            <option value="child">Child</option>
            <option value="parent">Parent</option>
            <option value="other">Other family</option>
          </select>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Adding…' : 'Add family member'}
        </Button>
      </form>
    </Card>
  )
}

interface HealthProfileData {
  date_of_birth: string | null
  height_cm: string | null
  weight_kg: string | null
  blood_type: string | null
  allergies: string | null
  conditions: string | null
}

const BLOOD_TYPES = ['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function HealthBasicsCard({ highlight }: { highlight: boolean }) {
  const [form, setForm] = useState<HealthProfileData | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get<HealthProfileData>('/api/profile/health')
      .then(setForm)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load health basics.'))
  }, [])

  function set(field: keyof HealthProfileData, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
    setSaved(false)
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    setError('')
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]),
      )
      setForm(await api.put<HealthProfileData>('/api/profile/health', payload))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={`mb-6 ${highlight ? 'ring-2 ring-teal-500/40' : ''}`}>
      <h2 className="flex items-center gap-2 font-semibold text-slate-800">
        <HeartPulse className="h-4 w-4 text-teal-600" /> Health basics
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        A few details that help tailor your care plans and the assistant's answers. Allergies and
        ongoing conditions matter most. All fields are optional.
      </p>
      {!form ? (
        <Spinner label="Loading…" />
      ) : (
        <form onSubmit={onSave} className="mt-4 space-y-3">
          {error && <ErrorBanner message={error} />}
          {saved && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              Saved. Your assistant and future care plans will use this.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
              <input
                type="date"
                className={inputClass}
                value={form.date_of_birth ?? ''}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Height (cm)</label>
              <input
                type="number"
                min={30}
                max={250}
                className={inputClass}
                value={form.height_cm ?? ''}
                onChange={(e) => set('height_cm', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Weight (kg)</label>
              <input
                type="number"
                min={1}
                max={400}
                className={inputClass}
                value={form.weight_kg ?? ''}
                onChange={(e) => set('weight_kg', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Blood type</label>
              <select
                className={inputClass}
                value={form.blood_type ?? 'unknown'}
                onChange={(e) => set('blood_type', e.target.value)}
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt === 'unknown' ? "Don't know" : bt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Allergies</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="e.g. penicillin, peanuts"
                value={form.allergies ?? ''}
                onChange={(e) => set('allergies', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ongoing conditions</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="e.g. type 2 diabetes, hypertension"
                value={form.conditions ?? ''}
                onChange={(e) => set('conditions', e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save health basics'}
          </Button>
        </form>
      )}
    </Card>
  )
}

interface NotificationSettings {
  daily_digest: boolean
  hour_local: number
  tz_offset_minutes: number
  subscribed_devices: number
}

function ReminderCard() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const supported = pushSupported()

  useEffect(() => {
    api
      .get<NotificationSettings>('/api/notifications/settings')
      .then(setSettings)
      .catch(() => {})
  }, [])

  async function save(next: { daily_digest: boolean; hour_local: number }) {
    const updated = await api.put<NotificationSettings>('/api/notifications/settings', {
      ...next,
      tz_offset_minutes: new Date().getTimezoneOffset(),
    })
    setSettings(updated)
  }

  async function onToggle() {
    if (!settings) return
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (!settings.daily_digest) {
        await enablePush()
        await save({ daily_digest: true, hour_local: settings.hour_local })
        setInfo('Daily reminders are on for this browser.')
      } else {
        await disablePush()
        await save({ daily_digest: false, hour_local: settings.hour_local })
        setInfo('Daily reminders are off.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update notifications.')
    } finally {
      setBusy(false)
    }
  }

  async function onHourChange(hour: number) {
    if (!settings) return
    setError('')
    try {
      await save({ daily_digest: settings.daily_digest, hour_local: hour })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the time.')
    }
  }

  async function onTest() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await api.post('/api/notifications/test')
      setInfo('Test sent. It should appear in a few seconds.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-800">
        <BellRing className="h-4 w-4 text-teal-600" /> Daily care reminder
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        A short daily check-in with your medicines and care-plan tasks, sent to this browser even
        when Curastra is closed.
      </p>
      {!supported ? (
        <p className="mt-3 text-sm text-amber-700">
          This browser does not support push notifications. On iPhone, add Curastra to your Home
          Screen first.
        </p>
      ) : settings === null ? (
        <Spinner label="Loading settings…" />
      ) : (
        <div className="mt-4 space-y-3">
          {error && <ErrorBanner message={error} />}
          {info && <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">{info}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onToggle} disabled={busy} variant={settings.daily_digest ? 'secondary' : 'primary'}>
              {busy ? 'Working…' : settings.daily_digest ? 'Turn off reminders' : 'Turn on reminders'}
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Remind me around
              <select
                className={`${inputClass} !w-auto`}
                value={settings.hour_local}
                onChange={(e) => onHourChange(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
            {settings.daily_digest && (
              <Button variant="secondary" onClick={onTest} disabled={busy}>
                Send a test now
              </Button>
            )}
          </div>
          <p className="text-xs text-stone-400">
            {settings.subscribed_devices > 0
              ? `${settings.subscribed_devices} browser(s) subscribed. Delivery is approximate to the hour you choose.`
              : 'No browser subscribed yet. Turning reminders on will ask for permission.'}
          </p>
        </div>
      )}
    </Card>
  )
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'
  const [aadhaar, setAadhaar] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])

  const refreshProfiles = useCallback(async () => {
    try {
      setProfiles(await api.get<ProfileInfo[]>('/api/profiles'))
    } catch {
      /* non-fatal */
    }
  }, [])

  useEffect(() => {
    refreshProfiles()
  }, [refreshProfiles])

  if (!user) return null

  const activeId = getActiveProfileId()
  const abhaProfile =
    profiles.find((p) => (activeId ? String(p.id) === activeId : p.is_primary)) ?? null

  async function onLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/abha/enroll/initiate', { aadhaarNumber: aadhaar })
      setAadhaar('')
      await Promise.all([refreshUser(), refreshProfiles()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onUnlink() {
    setError('')
    try {
      await api.post('/api/abha/unlink')
      await Promise.all([refreshUser(), refreshProfiles()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlinking failed.')
    }
  }

  return (
    <div>
      <PageTitle
        title={isWelcome ? `Welcome, ${user.name.split(' ')[0]}` : 'Profile'}
        subtitle={
          isWelcome
            ? 'One quick step: fill in your health basics so your care plans and assistant fit you. You can skip this and return anytime.'
            : 'Your account, health basics, reminders, and health ID.'
        }
      />
      <ErrorBanner message={error} />

      <AccountCard />

      <FamilyCard profiles={profiles} refresh={refreshProfiles} />

      <HealthBasicsCard highlight={isWelcome} />

      <ReminderCard />

      <Card>
        <h2 className="flex items-center gap-2 font-semibold text-slate-800">
          <Link2 className="h-4 w-4 text-teal-600" /> ABHA Health ID
          {abhaProfile && !abhaProfile.is_primary && (
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-pine-900">
              for {abhaProfile.name}
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enroll with the Aadhaar number to create and link an Ayushman Bharat Health Account for
          the active profile. (Demonstration enrollment via the project's mock ABHA service; the
          official ABDM sandbox only accepts India-hosted servers.)
        </p>

        {abhaProfile?.abha_linked ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-emerald-800">
                  Linked · {abhaProfile.abha_number?.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
                </div>
                <div className="text-xs text-emerald-700">{abhaProfile.abha_address}</div>
              </div>
            </div>
            <Button variant="secondary" onClick={onUnlink} className="mt-3">
              Unlink
            </Button>
          </div>
        ) : (
          <form onSubmit={onLink} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Aadhaar number</label>
              <input
                required
                inputMode="numeric"
                pattern="\d{12}"
                maxLength={12}
                className={inputClass}
                placeholder="12-digit Aadhaar number"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
              />
              <p className="mt-1.5 text-xs text-stone-400">
                Your ABHA number and address are generated on enrollment.
              </p>
            </div>
            <Button type="submit" disabled={busy || aadhaar.length !== 12} className="sm:mb-6">
              {busy ? 'Enrolling…' : 'Enroll & link ABHA'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
