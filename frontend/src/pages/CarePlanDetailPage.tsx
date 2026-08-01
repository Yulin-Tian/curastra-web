import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertOctagon, ArrowLeft, Check, HelpCircle, Pill, Plus, Printer, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { AdherenceState, CarePlan, Medication } from '../api/types'
import { Button, Card, Disclaimer, ErrorBanner, PageTitle, Spinner } from '../components/ui'
import { ProgressRing } from '../components/ProgressRing'
import { SimplifyButton } from '../components/SimplifyButton'

function localDay(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const categoryLabels: Record<string, string> = {
  medication: 'Medication',
  follow_up: 'Follow-up',
  monitoring: 'Monitoring',
  lifestyle: 'Lifestyle',
  safety: 'Safety',
  other: 'Other',
}

export default function CarePlanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<CarePlan | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<Medication[] | null>(null)
  const [adherence, setAdherence] = useState<AdherenceState | null>(null)
  const [justChecked, setJustChecked] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<CarePlan>(`/api/care-plans/${id}`)
      .then(setPlan)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load the plan.'))
    api
      .get<AdherenceState>(`/api/care-plans/${id}/adherence?day=${localDay()}`)
      .then(setAdherence)
      .catch(() => {})
  }, [id])

  async function onToggleTask(index: number) {
    try {
      const next = await api.post<AdherenceState>(`/api/care-plans/${id}/tasks/${index}/toggle`, {
        day: localDay(),
      })
      if (next.completed.includes(index)) setJustChecked(index)
      setAdherence(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the task.')
    }
  }

  async function onImportMeds() {
    setImporting(true)
    setError('')
    try {
      setImported(await api.post<Medication[]>(`/api/care-plans/${id}/import-medications`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete this care plan?')) return
    try {
      await api.delete(`/api/care-plans/${id}`)
      navigate('/care-plans')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  if (!plan) {
    return error ? <ErrorBanner message={error} /> : <Spinner label="Loading care plan…" />
  }

  const { medications, tasks, red_flags, clarification_questions, safety_disclaimer } = plan.plan

  return (
    <div>
      <button
        onClick={() => navigate('/care-plans')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to care plans
      </button>
      <PageTitle
        title="Your Care Plan"
        subtitle={`Generated ${new Date(plan.created_at).toLocaleString()} from your confirmed text`}
      />
      <ErrorBanner message={error} />

      {red_flags.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertOctagon className="h-5 w-5" /> Warning signs: seek medical help if these occur
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {red_flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {clarification_questions.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-800">
            <HelpCircle className="h-5 w-5" /> Please clarify with your doctor or pharmacist
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
            {clarification_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <Pill className="h-4 w-4 text-teal-600" /> Medications
            </h2>
            {medications.length > 0 && (
              <Button variant="secondary" onClick={onImportMeds} disabled={importing} className="!px-2.5 !py-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {importing ? 'Adding…' : 'Add to my medications'}
              </Button>
            )}
          </div>
          {imported && (
            <p className="mb-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
              {imported.length === 0
                ? 'All of these are already in your medication list.'
                : `Added ${imported.length} medication(s) to your list.`}
            </p>
          )}
          {medications.length === 0 ? (
            <p className="text-sm text-slate-500">No medications were identified.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {medications.map((med, i) => (
                <li key={`${med.name}-${i}`} className="py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-slate-800">{med.name ?? 'Unnamed'}</span>
                    {med.confidence && med.confidence !== 'high' && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-600">
                        {med.confidence} confidence, please verify
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {[med.strength ?? med.dosage, med.frequency, med.timing, med.duration]
                      .filter(Boolean)
                      .join(' · ') || 'No details'}
                  </div>
                  {med.original_line && <SimplifyButton text={med.original_line} />}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="font-semibold text-slate-800">Tasks & follow-ups</h2>
          </div>
          {adherence && tasks.length > 0 && (
            <div className="mb-4 rounded-xl bg-sage-50/70 p-3 print:hidden">
              <ProgressRing done={adherence.completed.length} total={adherence.total_tasks} />
            </div>
          )}
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks were identified.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task, i) => {
                const done = adherence?.completed.includes(i) ?? false
                return (
                  <li key={i} className={`flex gap-3 rounded-lg p-3 transition-colors ${done ? 'bg-teal-50/70' : 'bg-slate-50'}`}>
                    <button
                      onClick={() => onToggleTask(i)}
                      title={done ? 'Mark as not done today' : 'Mark as done today'}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors print:hidden ${
                        done
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-stone-300 bg-white text-transparent hover:border-teal-500'
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 ${done && justChecked === i ? 'anim-pop' : ''}`} strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {categoryLabels[task.category] ?? task.category}
                      </span>
                      <p className={`mt-1 text-sm ${done ? 'text-slate-500 line-through decoration-teal-600/40' : 'text-slate-700'}`}>
                        {task.instruction}
                      </p>
                      {task.schedule && <p className="mt-0.5 text-xs text-slate-400">{task.schedule}</p>}
                      <span className="print:hidden">
                        <SimplifyButton text={task.instruction} />
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <Disclaimer text={safety_disclaimer} />
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / save as PDF
          </Button>
          <Button variant="danger" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete this plan
          </Button>
        </div>
      </Card>
    </div>
  )
}
