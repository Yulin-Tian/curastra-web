import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan } from '../api/types'
import { EmptyState, ErrorBanner, PageTitle, SkeletonList } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

function localDay(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

import { suggestPlanName } from '../utils/planName'

function StatusChip({ p }: { p: CarePlan }) {
  const { t } = useLang()
  if (p.status === 'completed') {
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        {t('plans.statusDone')}
      </span>
    )
  }
  if (p.status === 'active') {
    if (p.starts_on && p.duration_days) {
      const endDay = addDays(p.starts_on, p.duration_days - 1)
      const today = localDay()
      if (today > endDay) {
        return (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            {t('plans.statusCheckin')}
          </span>
        )
      }
      const dayOf = Math.floor((new Date(today).getTime() - new Date(p.starts_on).getTime()) / 86400000) + 1
      return (
        <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
          {t('plans.statusDay', { x: String(dayOf), n: String(p.duration_days) })}
        </span>
      )
    }
    return (
      <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
        {t('plans.statusActive')}
      </span>
    )
  }
  if (p.status === 'draft') {
    return (
      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
        {t('plans.statusDraft')}
      </span>
    )
  }
  return null // legacy plan: no lifecycle
}

export default function CarePlansPage() {
  const { t } = useLang()
  const [plans, setPlans] = useState<CarePlan[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<CarePlan[]>('/api/care-plans')
      .then(setPlans)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load care plans.'))
  }, [])

  return (
    <div>
      <PageTitle title={t('plans.title')} subtitle={t('plans.sub')} />
      <ErrorBanner message={error} />
      {plans === null ? (
        <SkeletonList />
      ) : plans.length === 0 ? (
        <EmptyState title={t('plans.empty')} hint={t('plans.emptyHint')} />
      ) : (
        <ul className="space-y-2">
          {plans.map((p) => {
            const title = p.title ?? suggestPlanName(p)
            return (
              <li key={p.id}>
                <Link
                  to={`/care-plans/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-teal-300"
                >
                  <ClipboardList className="h-5 w-5 shrink-0 text-teal-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-800">
                      {title ?? t('plans.itemTitle')}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()} · {p.plan.medications.length}{' '}
                      {t('plans.medsCount')} · {p.plan.tasks.length} {t('plans.tasksCount')}
                      {p.plan.red_flags.length > 0 && (
                        <span className="ml-1 text-red-500">
                          · {p.plan.red_flags.length} {t('plans.redFlagsCount')}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusChip p={p} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
