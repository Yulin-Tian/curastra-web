import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { BadgeCheck, BellRing, Camera, Copy, HeartPulse, KeyRound, Link2, Share2, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api, getActiveProfileId, getToken, switchProfile } from '../api/client'
import { disablePush, enablePush, pushSupported } from '../api/push'
import type { ProfileInfo, ShareLink } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, ErrorBanner, PageTitle, Segmented, Spinner, StyledSelect, inputClass } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

function AccountCard() {
  const { user, refreshUser } = useAuth()
  const { t } = useLang()
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
      setInfo(t('acct.photoUpdated'))
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
      setInfo(t('acct.pwChanged'))
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
      setInfo(t('acct.2faEnabled'))
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
      setInfo(t('acct.2faDisabled'))
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
            <KeyRound className="h-3.5 w-3.5" /> {t('acct.changePassword')}
          </Button>
          {user.totp_enabled ? (
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowDisable((v) => !v)}>
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> {t('acct.2faOn')}
            </Button>
          ) : (
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={onStartTotp}>
              <ShieldCheck className="h-3.5 w-3.5" /> {t('acct.setup2fa')}
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
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('acct.currentPassword')}</label>
            <input type="password" required className={inputClass} value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('acct.newPassword')}</label>
            <input type="password" required minLength={10} className={inputClass} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
            <p className="mt-1 text-xs text-stone-400">{t('auth.pwHint')}</p>
          </div>
          <Button type="submit" disabled={busy}>{busy ? t('common.saving') : t('acct.updatePassword')}</Button>
        </form>
      )}

      {qr && (
        <form onSubmit={onEnableTotp} className="mt-4 flex flex-col items-start gap-4 border-t border-slate-100 pt-4 sm:flex-row">
          <img src={qr} alt="Authenticator QR code" className="rounded-lg border border-slate-200" />
          <div className="flex-1">
            <p className="text-sm text-slate-600">
              {t('acct.scanQr')}
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
              <Button type="submit" disabled={busy || totpCode.length !== 6}>{t('acct.turnOn2fa')}</Button>
            </div>
          </div>
        </form>
      )}

      {showDisable && (
        <form onSubmit={onDisableTotp} className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('acct.disable2faLabel')}</label>
            <input type="password" required className={inputClass} value={disablePw} onChange={(e) => setDisablePw(e.target.value)} />
          </div>
          <Button variant="danger" type="submit" disabled={busy}>{t('acct.turnOff2fa')}</Button>
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
  const { t } = useLang()
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
    if (!window.confirm(t('fam.removeConfirm', { name: p.name }))) return
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
        <Users className="h-4 w-4 text-teal-600" /> {t('fam.title')}
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        {t('fam.desc')}
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
                  {p.is_primary && <span className="ml-1.5 text-xs text-stone-400">{t('fam.you')}</span>}
                </div>
                <div className="text-xs text-stone-400">
                  {t('chrome.' + (p.relationship === 'self' ? 'me' : p.relationship))} · {p.abha_linked ? t('fam.abhaLinked') : t('fam.noAbha')}
                </div>
              </div>
              {isActive ? (
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  {t('fam.active')}
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="!px-2.5 !py-1 text-xs"
                  onClick={() => switchProfile(p.id, p.relationship, p.is_primary)}
                >
                  {t('fam.switchTo')}
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
          <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.name')}</label>
          <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amma" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{t('fam.theyAreMy')}</label>
          <Segmented
            value={relationship}
            onChange={setRelationship}
            options={[
              { value: 'child', label: t('chrome.child') },
              { value: 'parent', label: t('chrome.parent') },
              { value: 'other', label: t('chrome.other') },
            ]}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t('common.adding') : t('fam.addMember')}
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
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

const BLOOD_TYPES = ['unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function HealthBasicsCard({ highlight }: { highlight: boolean }) {
  const { t } = useLang()
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
        <HeartPulse className="h-4 w-4 text-teal-600" /> {t('basics.title')}
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        {t('basics.desc')}
      </p>
      {!form ? (
        <Spinner label="Loading…" />
      ) : (
        <form onSubmit={onSave} className="mt-4 space-y-3">
          {error && <ErrorBanner message={error} />}
          {saved && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              {t('basics.saved')}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.dob')}</label>
              <input
                type="date"
                className={inputClass}
                value={form.date_of_birth ?? ''}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.height')}</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.weight')}</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.blood')}</label>
              <StyledSelect
                value={form.blood_type ?? 'unknown'}
                onChange={(e) => set('blood_type', e.target.value)}
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt === 'unknown' ? t('basics.dontKnow') : bt}
                  </option>
                ))}
              </StyledSelect>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.allergies')}</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="e.g. penicillin, peanuts"
                value={form.allergies ?? ''}
                onChange={(e) => set('allergies', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.conditions')}</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="e.g. type 2 diabetes, hypertension"
                value={form.conditions ?? ''}
                onChange={(e) => set('conditions', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.emName')}</label>
              <input
                className={inputClass}
                placeholder="e.g. Priya Sharma"
                value={form.emergency_contact_name ?? ''}
                onChange={(e) => set('emergency_contact_name', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('basics.emPhone')}</label>
              <input
                type="tel"
                className={inputClass}
                placeholder="e.g. +91 98765 43210"
                value={form.emergency_contact_phone ?? ''}
                onChange={(e) => set('emergency_contact_phone', e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? t('common.saving') : t('basics.saveBtn')}
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
  const { t } = useLang()
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
        <BellRing className="h-4 w-4 text-teal-600" /> {t('rem.title')}
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        {t('rem.desc')}
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
              {busy ? t('common.working') : settings.daily_digest ? t('rem.turnOff') : t('rem.turnOn')}
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              {t('rem.remindAt')}
              <StyledSelect
                className="!w-auto"
                value={settings.hour_local}
                onChange={(e) => onHourChange(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </StyledSelect>
            </label>
            {settings.daily_digest && (
              <Button variant="secondary" onClick={onTest} disabled={busy}>
                {t('rem.sendTest')}
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

function ShareCard() {
  const { t, lang } = useLang()
  const [links, setLinks] = useState<ShareLink[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = useCallback(() => {
    api.get<ShareLink[]>('/api/share').then(setLinks).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const urlFor = (token: string) => `${window.location.origin}/share/${token}`

  async function onCreate() {
    setBusy(true)
    setError('')
    try {
      const link = await api.post<ShareLink>('/api/share', {})
      setLinks((prev) => [link, ...prev])
      await copy(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create link.')
    } finally {
      setBusy(false)
    }
  }

  async function copy(link: ShareLink) {
    try {
      await navigator.clipboard.writeText(urlFor(link.token))
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      /* clipboard blocked — the URL is still visible to select manually */
    }
  }

  async function onRevoke(id: number) {
    try {
      await api.delete(`/api/share/${id}`)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke link.')
    }
  }

  const locale = lang === 'hi' ? 'hi-IN' : 'en-GB'

  return (
    <Card className="mb-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-800">
        <Share2 className="h-4 w-4 text-teal-600" /> {t('share.title')}
      </h2>
      <p className="mt-1 text-sm text-stone-500">{t('share.desc')}</p>
      {error && (
        <div className="mt-3">
          <ErrorBanner message={error} />
        </div>
      )}
      <div className="mt-4">
        <Button onClick={onCreate} disabled={busy}>
          {busy ? t('common.saving') : t('share.createBtn')}
        </Button>
      </div>
      {links.length > 0 && (
        <ul className="mt-4 space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
            >
              <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{urlFor(link.token)}</code>
              <span className="text-xs text-stone-400">
                {t('share.expires')}{' '}
                {new Date(link.expires_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </span>
              <button
                onClick={() => copy(link)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
              >
                <Copy className="h-3.5 w-3.5" /> {copiedId === link.id ? t('share.copied') : t('share.copy')}
              </button>
              <button
                onClick={() => onRevoke(link.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('share.revoke')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'
  const [aadhaar, setAadhaar] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  // Real ABDM flow: initiate returns a txnId, then the OTP step verifies.
  const [txnId, setTxnId] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [mobile, setMobile] = useState('')

  const refreshProfiles = useCallback(async () => {
    try {
      setProfiles(await api.get<ProfileInfo[]>('/api/profiles'))
      // Let the sidebar switcher pick up the change without a reload.
      window.dispatchEvent(new Event('curastra:profiles-changed'))
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
      const res = await api.post<{ data?: { txnId?: string; abhaNumber?: string } }>(
        '/api/abha/enroll/initiate',
        { aadhaarNumber: aadhaar },
      )
      if (res.data?.txnId) {
        // Real ABDM service: continue to the OTP step.
        setTxnId(res.data.txnId)
      } else {
        // Mock service: linked instantly.
        setAadhaar('')
        await Promise.all([refreshUser(), refreshProfiles()])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/abha/enroll/verify', { txnId, otp, mobileNumber: mobile })
      setTxnId(null)
      setAadhaar('')
      setOtp('')
      setMobile('')
      await Promise.all([refreshUser(), refreshProfiles()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
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
        title={isWelcome ? `Welcome, ${user.name.split(' ')[0]}` : t('profile.title')}
        subtitle={
          isWelcome
            ? 'One quick step: fill in your health basics so your care plans and assistant fit you. You can skip this and return anytime.'
            : t('profile.sub')
        }
      />
      <AccountCard />

      <FamilyCard profiles={profiles} refresh={refreshProfiles} />

      <HealthBasicsCard highlight={isWelcome} />

      <ReminderCard />

      <ShareCard />

      <Card>
        <h2 className="flex items-center gap-2 font-semibold text-slate-800">
          <Link2 className="h-4 w-4 text-teal-600" /> {t('abha.title')}
          {abhaProfile && !abhaProfile.is_primary && (
            <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-pine-900">
              {t('abha.for', { name: abhaProfile.name })}
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('abha.desc')}
        </p>

        {/* ABHA errors belong here, next to the form the user just used —
            not in a banner at the top of the page. */}
        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} />
          </div>
        )}

        {abhaProfile?.abha_linked ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-emerald-800">
                  {t('abha.linked')} · {abhaProfile.abha_number?.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')}
                </div>
                <div className="text-xs text-emerald-700">{abhaProfile.abha_address}</div>
              </div>
            </div>
            <Button variant="secondary" onClick={onUnlink} className="mt-3">
              {t('abha.unlink')}
            </Button>
          </div>
        ) : txnId ? (
          <form onSubmit={onVerifyOtp} className="mt-4 space-y-3">
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              <strong>{t('abha.otpTitle')}.</strong> {t('abha.otpDesc')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t('abha.otp')}</label>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  className={`${inputClass} !w-36 text-center tracking-[0.3em]`}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">{t('abha.mobile')}</label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  required
                  className={inputClass}
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button type="submit" disabled={busy || otp.length !== 6 || mobile.length !== 10}>
                {busy ? t('abha.verifying') : t('abha.verifyBtn')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setTxnId(null); setOtp(''); }}>
                {t('abha.startOver')}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={onLink} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('abha.aadhaar')}</label>
              <input
                required
                inputMode="numeric"
                pattern="\d{12}"
                maxLength={12}
                className={inputClass}
                placeholder={t('abha.aadhaarPh')}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
              />
              <p className="mt-1.5 text-xs text-stone-400">
                {t('abha.genNote')}
              </p>
            </div>
            <Button type="submit" disabled={busy || aadhaar.length !== 12} className="sm:mb-6">
              {busy ? t('abha.enrolling') : t('abha.enroll')}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
