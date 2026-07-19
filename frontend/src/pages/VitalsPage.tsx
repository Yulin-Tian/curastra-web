import { useEffect, useState } from 'react'
import { Activity, Lightbulb, Plus, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { Insight, InsightsResult, Vital } from '../api/types'
import { Button, Card, Disclaimer, EmptyState, ErrorBanner, PageTitle, Spinner, inputClass } from '../components/ui'

const vitalTypes = [
  { value: 'blood_pressure', label: 'Blood pressure', unit: 'mmHg', placeholder: '120/80' },
  { value: 'glucose', label: 'Blood glucose', unit: 'mg/dL', placeholder: '95' },
  { value: 'weight', label: 'Weight', unit: 'kg', placeholder: '70' },
  { value: 'heart_rate', label: 'Heart rate', unit: 'bpm', placeholder: '72' },
  { value: 'temperature', label: 'Temperature', unit: '°C', placeholder: '36.8' },
]

const categoryColors: Record<Insight['category'], string> = {
  trend: 'bg-blue-50 text-blue-700',
  adherence: 'bg-purple-50 text-purple-700',
  lifestyle: 'bg-emerald-50 text-emerald-700',
  follow_up: 'bg-amber-50 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

export default function VitalsPage() {
  const [vitals, setVitals] = useState<Vital[] | null>(null)
  const [error, setError] = useState('')
  const [type, setType] = useState(vitalTypes[0])
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [insights, setInsights] = useState<InsightsResult | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

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

  const typeLabel = (t: string) => vitalTypes.find((v) => v.value === t)?.label ?? t

  return (
    <div>
      <PageTitle title="Vitals & Insights" subtitle="Log your readings and get gentle, factual insights." />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              className={inputClass}
              value={type.value}
              onChange={(e) => setType(vitalTypes.find((v) => v.value === e.target.value) ?? vitalTypes[0])}
            >
              {vitalTypes.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Reading ({type.unit})</label>
            <input required className={inputClass} value={value} placeholder={type.placeholder} onChange={(e) => setValue(e.target.value)} />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus className="h-4 w-4" /> {adding ? 'Logging…' : 'Log reading'}
          </Button>
        </form>
      </Card>

      {vitals === null ? (
        <Spinner label="Loading vitals…" />
      ) : vitals.length === 0 ? (
        <EmptyState title="No readings yet" hint="Log your first blood pressure, glucose, or weight reading above." />
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Activity className="h-4 w-4 text-teal-600" /> History
              </h2>
              <Button variant="secondary" onClick={onInsights} disabled={loadingInsights} className="!px-3 !py-1.5 text-xs">
                <Lightbulb className="h-3.5 w-3.5" />
                {loadingInsights ? 'Thinking…' : 'Get insights'}
              </Button>
            </div>
            {loadingInsights && <Spinner label="Looking for patterns in your readings…" />}
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
                <Lightbulb className="h-4 w-4 text-amber-500" /> Health insights
              </h2>
              {insights.insights.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing notable — keep logging regularly.</p>
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
