import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan } from '../api/types'
import { EmptyState, ErrorBanner, PageTitle, Spinner } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

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
        <Spinner label="Loading care plans…" />
      ) : plans.length === 0 ? (
        <EmptyState title={t('plans.empty')} hint={t('plans.emptyHint')} />
      ) : (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li key={p.id}>
              <Link
                to={`/care-plans/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-teal-300"
              >
                <ClipboardList className="h-5 w-5 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800">
                    {t('plans.itemTitle')} · {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {p.plan.medications.length} {t('plans.medsCount')} · {p.plan.tasks.length} {t('plans.tasksCount')}
                    {p.plan.red_flags.length > 0 && (
                      <span className="ml-1 text-red-500">· {p.plan.red_flags.length} {t('plans.redFlagsCount')}</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
