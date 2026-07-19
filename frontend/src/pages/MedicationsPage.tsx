import { useEffect, useState } from 'react'
import { Pill, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { MedAlert, Medication, MedSafetyResult } from '../api/types'
import { Button, Card, Disclaimer, EmptyState, ErrorBanner, PageTitle, Spinner, inputClass } from '../components/ui'

const alertStyles: Record<MedAlert['severity'], string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  caution: 'border-amber-200 bg-amber-50 text-amber-800',
  warning: 'border-red-200 bg-red-50 text-red-800',
}

export default function MedicationsPage() {
  const [meds, setMeds] = useState<Medication[] | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState(false)
  const [safety, setSafety] = useState<MedSafetyResult | null>(null)

  async function load() {
    try {
      setMeds(await api.get<Medication[]>('/api/medications'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medications.')
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
      await api.post('/api/medications', {
        name,
        dosage: dosage || null,
        frequency: frequency || null,
      })
      setName('')
      setDosage('')
      setFrequency('')
      setSafety(null) // list changed; the previous check is stale
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the medication.')
    } finally {
      setAdding(false)
    }
  }

  async function onRemove(id: number) {
    try {
      await api.delete(`/api/medications/${id}`)
      setSafety(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the medication.')
    }
  }

  async function onCheckSafety() {
    setChecking(true)
    setError('')
    setSafety(null)
    try {
      setSafety(await api.post<MedSafetyResult>('/api/medications/safety-check'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Safety check failed.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div>
      <PageTitle
        title="Medications"
        subtitle="Your current medicines. Run a safety check for duplicates and interactions."
      />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pan 40" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dosage</label>
            <input className={inputClass} value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="40 mg" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Frequency</label>
            <input className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Once daily" />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus className="h-4 w-4" /> {adding ? 'Adding…' : 'Add'}
          </Button>
        </form>
      </Card>

      {meds === null ? (
        <Spinner label="Loading medications…" />
      ) : meds.length === 0 ? (
        <EmptyState
          title="No medications yet"
          hint="Add them manually above, or import them from a generated care plan."
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-slate-100">
              {meds.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Pill className="h-4 w-4 shrink-0 text-teal-600" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {[m.dosage, m.frequency, m.timing, m.duration].filter(Boolean).join(' · ') || 'No details'}
                    </div>
                  </div>
                  <button onClick={() => onRemove(m.id)} title="Remove" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Button onClick={onCheckSafety} disabled={checking}>
                <ShieldCheck className="h-4 w-4" />
                {checking ? 'Checking…' : 'Run safety check'}
              </Button>
              {checking && <Spinner label="Checking for duplicates and interactions…" />}
            </div>
          </Card>

          {safety && (
            <Card className="mt-6">
              <h2 className="mb-3 font-semibold text-slate-800">Safety check results</h2>
              {safety.alerts.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> No duplicates or interactions were flagged.
                </p>
              ) : (
                <ul className="space-y-2">
                  {safety.alerts.map((alert, i) => (
                    <li key={i} className={`rounded-lg border px-3 py-2 text-sm ${alertStyles[alert.severity]}`}>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {alert.severity}
                        </span>
                        <span className="text-xs font-medium">{alert.medications.join(' + ')}</span>
                      </div>
                      <p className="mt-1">{alert.message}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Disclaimer text={safety.disclaimer} />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
