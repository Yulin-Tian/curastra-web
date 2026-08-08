import { useEffect, useMemo, useState } from 'react'
import { Activity, Lightbulb, Plus, TrendingUp, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { Insight, InsightsResult, Vital } from '../api/types'
import { Button, Card, Disclaimer, EcgLine, EmptyState, ErrorBanner, PageTitle, Segmented, SkeletonList, Spinner, inputClass } from '../components/ui'
import { VitalsChart } from '../components/VitalsChart'
import { useLang } from '../i18n/LanguageContext'

const vitalTypes = [
  { value: 'blood_pressure', labelKey: 'vitals.bp', unit: 'mmHg', placeholder: '120/80' },
  { value: 'glucose', labelKey: 'vitals.glucose', unit: 'mg/dL', placeholder: '95' },
  { value: 'weight', labelKey: 'vitals.weight', unit: 'kg', placeholder: '70' },
  { value: 'heart_rate', labelKey: 'vitals.hr', unit: 'bpm', placeholder: '72' },
  { value: 'temperature', labelKey: 'vitals.temp', unit: '°C', placeholder: '36.8' },
]

const categoryColors: Record<Insight['category'], string> = {
  trend: 'bg-blue-50 text-blue-700',
  adherence: 'bg-purple-50 text-purple-700',
  lifestyle: 'bg-emerald-50 text-emerald-700',
  follow_up: 'bg-amber-50 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

export default function VitalsPage() {
  const { t } = useLang()
  const [vitals, setVitals] = useState<Vital[] | null>(null)
  const [error, setError] = useState('')
  const [type, setType] = useState(vitalTypes[0])
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [insights, setInsights] = useState<InsightsResult | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [chartType, setChartType] = useState<string | null>(null)

  // Chart the most-logged type by default; user can switch.
  const chartable = useMemo(() => {
    const counts = new Map<string, Vital[]>()
    for (const v of vitals ?? []) {
      counts.set(v.type, [...(counts.get(v.type) ?? []), v])
    }
    return [...counts.entries()].filter(([, list]) => list.length >= 2).sort((a, b) => b[1].length - a[1].length)
  }, [vitals])
  const activeChart = chartType ?? chartable[0]?.[0] ?? null
  const chartVitals = chartable.find(([t]) => t === activeChart)?.[1] ?? []

  async function load() {
    try {
      setVitals(await api.get<Vital[]>('/api/vitals'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vitals.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')
    try {
      await api.post('/api/vitals', { type: type.value, value, unit: type.unit })
      setValue('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log the reading.')
    } finally {
      setAdding(false)
    }
  }

  async function onRemove(id: number) {
    try {
      await api.delete(`/api/vitals/${id}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the entry.')
    }
  }

  async function onInsights() {
    setLoadingInsights(true)
    setError('')
    setInsights(null)
    try {
      setInsights(await api.post<InsightsResult>('/api/vitals/insights'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate insights.')
    } finally {
      setLoadingInsights(false)
    }
  }

  const typeLabel = (code: string) => {
    const k = vitalTypes.find((v) => v.value === code)?.labelKey
    return k ? t(k) : code
  }

  return (
    <div>
      <PageTitle title={t('vitals.title')} subtitle={t('vitals.sub')} />
      <EcgLine className="-mt-4 mb-6" />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.type')}</label>
            <Segmented
              value={type.value}
              onChange={(v) => setType(vitalTypes.find((x) => x.value === v) ?? vitalTypes[0])}
              options={vitalTypes.map((v) => ({ value: v.value, label: t(v.labelKey) }))}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('vitals.reading')} ({type.unit})</label>
            <input required className={inputClass} value={value} placeholder={type.placeholder} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus className="h-4 w-4" /> {adding ? t('vitals.logging') : t('vitals.logReading')}
          </Button>
        </form>
      </Card>

      {vitals === null ? (
        <SkeletonList />
      ) : vitals.length === 0 ? (
        <EmptyState title={t('vitals.empty')} hint={t('vitals.emptyHint')} />
      ) : (
        <>
          {activeChart && chartVitals.length >= 2 && (
            <Card className="mb-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <TrendingUp className="h-4 w-4 text-teal-600" /> {t('vitals.trend')}
                </h2>
                {chartable.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chartable.map(([t]) => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          t === activeChart ? 'bg-pine-900 text-white' : 'bg-sage-100 text-pine-900 hover:bg-sage-200'
                        }`}
                      >
                        {typeLabel(t)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <VitalsChart vitals={chartVitals} unit={chartVitals[0]?.unit ?? ''} />
            </Card>
          )}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Activity className="h-4 w-4 text-teal-600" /> {t('vitals.history')}
              </h2>
              <Button variant="secondary" onClick={onInsights} disabled={loadingInsights} className="!px-3 !py-1.5 text-xs">
                <Lightbulb className="h-3.5 w-3.5" />
                {loadingInsights ? t('common.thinking') : t('vitals.getInsights')}
              </Button>
            </div>
            {loadingInsights && <Spinner label={t('vitals.insightsSpinner')} />}
            <ul className="divide-y divide-slate-100">
              {vitals.map((v) => (
                <li key={v.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-800">{typeLabel(v.type)}</span>
                    <span className="ml-2 text-slate-600">
                      {v.value} {v.unit}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(v.measured_at).toLocaleString()}</span>
                  <button onClick={() => onRemove(v.id)} title="Delete" className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {insights && (
            <Card className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                <Lightbulb className="h-4 w-4 text-amber-500" /> {t('vitals.insightsTitle')}
              </h2>
              {insights.insights.length === 0 ? (
                <p className="text-sm text-slate-500">{t('vitals.nothingNotable')}</p>
              ) : (
                <ul className="space-y-3">
                  {insights.insights.map((ins, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{ins.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${categoryColors[ins.category]}`}>
                          {ins.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{ins.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Disclaimer text={insights.disclaimer} />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
