import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, AlertTriangle, ClipboardList, HeartPulse, Pill } from 'lucide-react'
import { api } from '../api/client'
import type { SharedSummary } from '../api/types'
import { useLang } from '../i18n/LanguageContext'
import { Card, Sparkline, Spinner } from '../components/ui'

const VITAL_LABELS: Record<string, string> = {
  blood_pressure: 'vitals.bp',
  glucose: 'vitals.glucose',
  weight: 'vitals.weight',
  heart_rate: 'vitals.hr',
  temperature: 'vitals.temp',
}

/** The doctor's / relative's view: read-only, no login, token in the URL. */
export default function SharedViewPage() {
  const { token } = useParams()
  const { t, lang } = useLang()
  const [data, setData] = useState<SharedSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<SharedSummary>(`/api/share/public/${token}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load.'))
  }, [token])

  const locale = lang === 'hi' ? 'hi-IN' : 'en-GB'
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  // Vitals grouped by type, oldest→newest, numeric lead value for the sparkline
  // ("120/80" → 120).
  const grouped = new Map<string, { value: string; unit: string | null; measured_at: string }[]>()
  for (const v of data?.vitals ?? []) {
    if (!grouped.has(v.type)) grouped.set(v.type, [])
    grouped.get(v.type)!.push(v)
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-teal-600" />
          <span className="text-xl font-semibold tracking-tight text-slate-900">Curastra</span>
        </div>

        {error ? (
          <Card>
            <p className="text-sm text-slate-600">{t('share.invalid')}</p>
          </Card>
        ) : !data ? (
          <Spinner label="Loading…" />
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t('share.sharedFor', { name: data.name })}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {t('share.generated')} {fmtDate(data.generated_at)} · {t('share.readOnly')}
            </p>

            <Card className="mt-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Pill className="h-4 w-4 text-teal-600" /> {t('nav.medications')}
              </h2>
              {data.medications.length === 0 ? (
                <p className="mt-2 text-sm text-stone-400">—</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {data.medications.map((m, i) => (
                    <li key={i} className="py-2">
                      <span className="font-medium text-slate-800">{m.name}</span>
                      <span className="text-sm text-stone-500">
                        {[m.dosage, m.frequency, m.timing, m.duration].filter(Boolean).map((p) => ` · ${p}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {data.care_plan && (
              <Card className="mt-4">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <ClipboardList className="h-4 w-4 text-teal-600" /> {t('share.latestPlan')}
                  <span className="text-sm font-normal text-stone-400">
                    {fmtDate(data.care_plan.created_at)}
                  </span>
                </h2>
                {data.care_plan.plan.tasks.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {data.care_plan.plan.tasks.map((task, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-teal-600">•</span>
                        <span>
                          {task.instruction}
                          {task.schedule ? <span className="text-stone-400"> — {task.schedule}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {data.care_plan.plan.red_flags.length > 0 && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                      <AlertTriangle className="h-4 w-4" /> {t('share.redFlags')}
                    </div>
                    <ul className="mt-1.5 space-y-1 text-sm text-amber-900">
                      {data.care_plan.plan.red_flags.map((flag, i) => (
                        <li key={i}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {grouped.size > 0 && (
              <Card className="mt-4">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <Activity className="h-4 w-4 text-teal-600" /> {t('nav.vitals')}
                </h2>
                <div className="mt-3 space-y-3">
                  {[...grouped.entries()].map(([type, readings]) => {
                    const latest = readings[0]
                    const series = [...readings]
                      .reverse()
                      .map((r) => parseFloat(r.value))
                      .filter((n) => !Number.isNaN(n))
                    return (
                      <div key={type} className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-slate-700">
                            {t(VITAL_LABELS[type] ?? 'vitals.reading')}
                          </div>
                          <div className="text-sm text-stone-500">
                            {latest.value} {latest.unit ?? ''} · {fmtDate(latest.measured_at)}
                          </div>
                        </div>
                        <Sparkline values={series} />
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            <p className="mt-6 text-center text-xs text-stone-400">{t('share.footer')}</p>
          </>
        )}
      </div>
    </div>
  )
}
