import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ClipboardList, FileText, MessageCircle, Pill, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan, HealthRecord, Medication, Vital } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Card, PageTitle } from '../components/ui'

export default function DashboardPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [plans, setPlans] = useState<CarePlan[]>([])
  const [meds, setMeds] = useState<Medication[]>([])
  const [vitals, setVitals] = useState<Vital[]>([])

  useEffect(() => {
    // Best-effort loads; the dashboard should render even if one call fails.
    api.get<HealthRecord[]>('/api/records').then(setRecords).catch(() => {})
    api.get<CarePlan[]>('/api/care-plans').then(setPlans).catch(() => {})
    api.get<Medication[]>('/api/medications').then(setMeds).catch(() => {})
    api.get<Vital[]>('/api/vitals?limit=1').then(setVitals).catch(() => {})
  }, [])

  const latestVital = vitals[0]
  const latestPlan = plans[0]

  const stats = [
    { label: 'Records', value: records.length, icon: FileText, to: '/records' },
    { label: 'Care plans', value: plans.length, icon: ClipboardList, to: '/care-plans' },
    { label: 'Active medications', value: meds.length, icon: Pill, to: '/medications' },
    {
      label: 'Last reading',
      value: latestVital ? `${latestVital.value} ${latestVital.unit ?? ''}` : '—',
      icon: Activity,
      to: '/vitals',
    },
  ]

  return (
    <div>
      <PageTitle
        title={`Hello, ${user?.name.split(' ')[0]}`}
        subtitle="Here is where your care stands today."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition-colors hover:border-teal-300">
              <Icon className="h-5 w-5 text-teal-600" />
              <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/records">
          <Card className="flex h-full items-center gap-4 transition-colors hover:border-teal-300">
            <div className="rounded-full bg-teal-50 p-3">
              <Upload className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Upload a prescription</div>
              <p className="text-sm text-slate-500">
                Scan it, review the text, and turn it into a clear care plan.
              </p>
            </div>
          </Card>
        </Link>
        <Link to="/assistant">
          <Card className="flex h-full items-center gap-4 transition-colors hover:border-teal-300">
            <div className="rounded-full bg-teal-50 p-3">
              <MessageCircle className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Ask the AI assistant</div>
              <p className="text-sm text-slate-500">
                Questions about your medicines, plan, or readings — answered in context.
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {latestPlan && latestPlan.plan.red_flags.length > 0 && (
        <Card className="mt-6 !border-red-200 !bg-red-50">
          <div className="font-semibold text-red-700">From your latest care plan — warning signs</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
            {latestPlan.plan.red_flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
          <Link to={`/care-plans/${latestPlan.id}`} className="mt-2 inline-block text-sm font-medium text-red-700 underline">
            Open the plan
          </Link>
        </Card>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        Curastra supports your everyday care. It never diagnoses or replaces medical advice.
      </p>
    </div>
  )
}
