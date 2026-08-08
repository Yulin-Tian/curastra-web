import { useEffect, useState } from 'react'
import {
  Activity,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  HeartPulse,
  Link2,
  MessageCircle,
  Pill,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api } from '../api/client'
import { Card, CountUp, ErrorBanner, PageTitle, SkeletonList, inputClass } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

interface Overview {
  totals: Record<string, number>
  care_plans_by_status: Record<string, number>
  trends: { days: string[]; signups: number[]; records: number[]; vitals: number[]; chats: number[] }
  services: { backend: { status: string }; database: { status: string }; engine: { status: string; latency_ms: number | null } }
  generated_at: string
}

interface AdminUser {
  id: number
  name: string
  email: string
  created_at: string
  totp_enabled: boolean
  abha_linked: boolean
  is_admin: boolean
  family_profiles: number
  records: number
  care_plans: number
  medications: number
  vitals: number
  last_active: string | null
}

/** 14-day mini bar chart, pure SVG in the theme palette. */
function TrendBars({ values, days }: { values: number[]; days: string[] }) {
  const max = Math.max(...values, 1)
  const w = 220
  const h = 56
  const bw = w / values.length
  return (
    <svg width={w} height={h} aria-hidden="true">
      {values.map((v, i) => {
        const bh = Math.max((v / max) * (h - 8), v > 0 ? 3 : 1)
        return (
          <rect
            key={days[i]}
            x={i * bw + 1.5}
            y={h - bh}
            width={bw - 3}
            height={bh}
            rx={2}
            className={v > 0 ? 'fill-teal-600' : 'fill-stone-200'}
            fillOpacity={v > 0 ? 0.85 : 0.8}
          />
        )
      })}
    </svg>
  )
}

function HealthChip({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}
      {detail && <span className="font-normal opacity-70">{detail}</span>}
    </span>
  )
}

export default function AdminPage() {
  const { t, lang } = useLang()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Overview>('/api/admin/overview')
      .then(setOverview)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the overview.'))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get<AdminUser[]>(`/api/admin/users?query=${encodeURIComponent(query)}`)
        .then(setUsers)
        .catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const locale = lang === 'hi' ? 'hi-IN' : 'en-GB'
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '—'

  const stats = overview
    ? [
        { label: t('admin.users'), value: overview.totals.users, icon: Users },
        { label: t('admin.familyProfiles'), value: overview.totals.family_profiles, icon: HeartPulse },
        { label: t('admin.records'), value: overview.totals.records, icon: FileText },
        { label: t('admin.carePlans'), value: overview.totals.care_plans, icon: ClipboardList },
        { label: t('admin.medications'), value: overview.totals.medications, icon: Pill },
        { label: t('admin.vitals'), value: overview.totals.vitals, icon: Activity },
        { label: t('admin.chats'), value: overview.totals.chat_messages, icon: MessageCircle },
        { label: t('admin.shareLinks'), value: overview.totals.active_share_links, icon: Link2 },
      ]
    : []

  const trendBlocks = overview
    ? [
        { label: t('admin.trendSignups'), values: overview.trends.signups },
        { label: t('admin.trendRecords'), values: overview.trends.records },
        { label: t('admin.trendVitals'), values: overview.trends.vitals },
        { label: t('admin.trendChats'), values: overview.trends.chats },
      ]
    : []

  return (
    <div>
      <PageTitle title={t('admin.title')} subtitle={t('admin.sub')} />
      <ErrorBanner message={error} />

      {overview && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <HealthChip label={t('admin.svcBackend')} ok={overview.services.backend.status === 'ok'} />
          <HealthChip label={t('admin.svcDb')} ok={overview.services.database.status === 'ok'} />
          <HealthChip
            label={t('admin.svcEngine')}
            ok={overview.services.engine.status === 'ok'}
            detail={overview.services.engine.latency_ms != null ? `${overview.services.engine.latency_ms} ms` : undefined}
          />
          <span className="ml-auto text-xs text-stone-400">
            {t('admin.privacyNote')}
          </span>
        </div>
      )}

      {!overview ? (
        <SkeletonList />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="!p-4">
                <span className="inline-flex rounded-lg bg-sage-100 p-2">
                  <Icon className="h-4 w-4 text-pine-800" strokeWidth={1.8} />
                </span>
                <div className="mt-2 font-display text-2xl font-medium text-pine-900">
                  <CountUp value={value} />
                </div>
                <div className="text-xs text-stone-500">{label}</div>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <Gauge className="h-4 w-4 text-teal-600" /> {t('admin.trendTitle')}
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendBlocks.map(({ label, values }) => (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span className="text-xs text-stone-400">
                      {values.reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <TrendBars values={values} days={overview.trends.days} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Users className="h-4 w-4 text-teal-600" /> {t('admin.usersTitle')}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  className={`${inputClass} !w-64 !py-1.5 pl-9 text-sm`}
                  placeholder={t('admin.searchPh')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            {users === null ? (
              <SkeletonList rows={3} />
            ) : users.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-400">{t('admin.noUsers')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-400">
                      <th className="pb-2 pr-4 font-medium">{t('admin.colUser')}</th>
                      <th className="pb-2 pr-4 font-medium">{t('admin.colJoined')}</th>
                      <th className="pb-2 pr-4 font-medium">{t('admin.colSecurity')}</th>
                      <th className="pb-2 pr-4 text-right font-medium">{t('admin.records')}</th>
                      <th className="pb-2 pr-4 text-right font-medium">{t('admin.carePlans')}</th>
                      <th className="pb-2 pr-4 text-right font-medium">{t('admin.vitals')}</th>
                      <th className="pb-2 text-right font-medium">{t('admin.colLastActive')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-pine-900">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                                {u.name}
                                {u.is_admin && <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />}
                              </span>
                              <span className="block truncate text-xs text-stone-400">{u.email}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-stone-500">{fmtDate(u.created_at)}</td>
                        <td className="py-2.5 pr-4">
                          <span className="flex gap-1.5">
                            {u.totp_enabled && (
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">2FA</span>
                            )}
                            {u.abha_linked && (
                              <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-medium text-pine-900">ABHA</span>
                            )}
                            {!u.totp_enabled && !u.abha_linked && <span className="text-xs text-stone-300">—</span>}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-stone-600">{u.records}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-stone-600">{u.care_plans}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-stone-600">{u.vitals}</td>
                        <td className="py-2.5 text-right text-stone-500">{fmtDate(u.last_active)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-stone-400">
            <Database className="h-3.5 w-3.5" />
            {t('admin.footer')}
          </p>
        </>
      )}
    </div>
  )
}
