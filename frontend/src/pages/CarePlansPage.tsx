import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan } from '../api/types'
import { EmptyState, ErrorBanner, PageTitle, Spinner } from '../components/ui'

export default function CarePlansPage() {
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
      <PageTitle
        title="Care Plans"
        subtitle="Structured after-care plans generated from your confirmed prescriptions."
      />
      <ErrorBanner message={error} />
      {plans === null ? (
        <Spinner label="Loading care plans…" />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No care plans yet"
          hint="Open a record, extract and confirm its text, then generate a plan."
        />
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
                    Care plan · {new Date(p.created_at).toLocaleDateString()}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {p.plan.medications.length} medication{p.plan.medications.length === 1 ? '' : 's'} ·{' '}
                    {p.plan.tasks.length} task{p.plan.tasks.length === 1 ? '' : 's'}
                    {p.plan.red_flags.length > 0 && (
                      <span className="ml-1 text-red-500">· {p.plan.red_flags.length} red flag(s)</span>
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
