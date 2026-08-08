import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertOctagon, ArrowLeft, Check, HelpCircle, Lock, Pill, Plus, Printer, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { AdherenceState, CarePlan, Medication } from '../api/types'
import { Button, Card, Disclaimer, ErrorBanner, PageTitle, Spinner } from '../components/ui'
import { AdherenceHeatmap } from '../components/AdherenceHeatmap'
import { ProgressRing } from '../components/ProgressRing'
import { SimplifyButton } from '../components/SimplifyButton'
import { useLang } from '../i18n/LanguageContext'

function localDay(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}



export default function CarePlanDetailPage() {
  const { t } = useLang()
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<CarePlan | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<Medication[] | null>(null)
  const [adherence, setAdherence] = useState<AdherenceState | null>(null)
  const [justChecked, setJustChecked] = useState<number | null>(null)
  // The day whose ticks are shown/edited; past days are picked via the heatmap.
  const [selectedDay, setSelectedDay] = useState(localDay())
  const [heatmapVersion, setHeatmapVersion] = useState(0)
  const viewingToday = selectedDay === localDay()

  useEffect(() => {
    api
      .get<CarePlan>(`/api/care-plans/${id}`)
      .then(setPlan)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load the plan.'))
  }, [id])

  useEffect(() => {
    api
      .get<AdherenceState>(`/api/care-plans/${id}/adherence?day=${selectedDay}`)
      .then(setAdherence)
      .catch(() => {})
  }, [id, selectedDay])

  async function onToggleTask(index: number) {
    try {
      const next = await api.post<AdherenceState>(`/api/care-plans/${id}/tasks/${index}/toggle`, {
        day: selectedDay,
      })
      if (next.completed.includes(index)) setJustChecked(index)
      setAdherence(next)
      setHeatmapVersion((v) => v + 1) // keep the calendar in step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the task.')
    }
  }

  async function onActivate() {
    try {
      setPlan(await api.post<CarePlan>(`/api/care-plans/${id}/activate`, { start_day: localDay() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the plan.')
    }
  }

  async function onOutcome(feeling: 'better' | 'not_better') {
    try {
      setPlan(await api.post<CarePlan>(`/api/care-plans/${id}/outcome`, { feeling }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your answer.')
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
    if (!window.confirm(t('plans.deleteConfirm'))) return
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
        <ArrowLeft className="h-4 w-4" /> {t('plans.backToPlans')}
      </button>
      <PageTitle
        title={t('plans.yourPlan')}
        subtitle={t('plans.generatedOn', { date: new Date(plan.created_at).toLocaleString() })}
      />
      <ErrorBanner message={error} />

      {/* Treatment lifecycle: confirm-to-start, the strict course window,
          the end-of-course check-in, and the recorded outcome. */}
      {plan.status === 'draft' && (
        <div className="mb-6 rounded-xl border border-teal-600/30 bg-teal-50 p-4 print:hidden">
          <div className="font-semibold text-pine-900">{t('plans.startTitle')}</div>
          <p className="mt-1 text-sm text-pine-900/80">
            {plan.duration_days
              ? t('plans.startTextKnown', { n: String(plan.duration_days) })
              : t('plans.startTextUnknown')}
          </p>
          <Button className="mt-3" onClick={onActivate}>
            {t('plans.startBtn')}
          </Button>
        </div>
      )}
      {plan.status === 'active' && plan.starts_on && plan.duration_days && (() => {
        const endDay = addDays(plan.starts_on, plan.duration_days - 1)
        const dayOf = Math.min(
          Math.max(1, Math.round((Date.parse(localDay()) - Date.parse(plan.starts_on)) / 86400000) + 1),
          plan.duration_days,
        )
        return localDay() > endDay ? (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 print:hidden">
            <div className="font-semibold text-amber-900">
              {t('plans.checkinTitle', { n: String(plan.duration_days) })}
            </div>
            <p className="mt-1 text-sm text-amber-900/80">{t('plans.checkinText')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => onOutcome('better')}>{t('plans.feelBetter')}</Button>
              <Button variant="secondary" onClick={() => onOutcome('not_better')}>
                {t('plans.notBetter')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-sm text-pine-900 print:hidden">
            {t('plans.courseChip', {
              start: plan.starts_on,
              end: endDay,
              x: String(dayOf),
              n: String(plan.duration_days),
            })}
          </div>
        )
      })()}
      {plan.status === 'completed' && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
            plan.outcome === 'better'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          {plan.outcome === 'better' ? t('plans.outcomeBetter') : t('plans.outcomeNotBetter')}
        </div>
      )}

      {red_flags.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertOctagon className="h-5 w-5" /> {t('plans.warningTitle')}
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
            <HelpCircle className="h-5 w-5" /> {t('plans.clarifyTitle')}
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
              <Pill className="h-4 w-4 text-teal-600" /> {t('plans.medications')}
            </h2>
            {medications.length > 0 && (
              <Button variant="secondary" onClick={onImportMeds} disabled={importing} className="!px-2.5 !py-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {importing ? t('common.adding') : t('plans.addToMeds')}
              </Button>
            )}
          </div>
          {imported && (
            <p className="mb-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
              {imported.length === 0
                ? t('plans.allImported')
                : t('plans.importedN', { n: String(imported.length) })}
            </p>
          )}
          {medications.length === 0 ? (
            <p className="text-sm text-slate-500">{t('plans.noMeds')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {medications.map((med, i) => (
                <li key={`${med.name}-${i}`} className="py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-slate-800">{med.name ?? 'Unnamed'}</span>
                    {med.confidence && med.confidence !== 'high' && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-600">
                        {med.confidence} {t('plans.confidence')}
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
            <h2 className="font-semibold text-slate-800">{t('plans.tasksTitle')}</h2>
          </div>
          {adherence && tasks.length > 0 && (
            <div className="mb-4 rounded-xl bg-sage-50/70 p-3 print:hidden">
              <ProgressRing
                done={adherence.completed.length}
                total={adherence.total_tasks}
                title={viewingToday ? undefined : t('plans.dayProgress', { date: selectedDay })}
              />
              {!viewingToday && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                  <span className="text-xs text-pine-900">{t('plans.viewingDay', { date: selectedDay })}</span>
                  <button
                    onClick={() => setSelectedDay(localDay())}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {t('plans.backToToday')}
                  </button>
                </div>
              )}
              {id && (
                <AdherenceHeatmap
                  planId={id}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  version={heatmapVersion}
                />
              )}
            </div>
          )}
          {adherence && adherence.completed.length > 0 && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-stone-400 print:hidden">
              <Lock className="h-3 w-3 shrink-0" /> {t('plans.lockNote')}
            </p>
          )}
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">{t('plans.noTasks')}</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task, i) => {
                const done = adherence?.completed.includes(i) ?? false
                const locked = done && (adherence?.locked.includes(i) ?? false)
                return (
                  <li key={i} className={`flex gap-3 rounded-lg p-3 transition-colors ${done ? 'bg-teal-50/70' : 'bg-slate-50'}`}>
                    <button
                      onClick={() => onToggleTask(i)}
                      disabled={locked}
                      title={locked ? t('plans.lockedTip') : done ? 'Mark as not done today' : 'Mark as done today'}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors print:hidden ${
                        locked
                          ? 'cursor-default border-teal-600/60 bg-teal-600/60 text-white'
                          : done
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-stone-300 bg-white text-transparent hover:border-teal-500'
                      }`}
                    >
                      {locked ? (
                        <Lock className="h-3 w-3" strokeWidth={2.5} />
                      ) : (
                        <Check className={`h-3.5 w-3.5 ${done && justChecked === i ? 'anim-pop' : ''}`} strokeWidth={3} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="mr-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        {t('cat.' + task.category)}
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
            <Printer className="h-4 w-4" /> {t('plans.print')}
          </Button>
          <Button variant="danger" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> {t('plans.deletePlan')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
