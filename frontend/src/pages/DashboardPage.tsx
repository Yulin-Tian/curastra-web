import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, ClipboardList, FileText, MessageCircle, Pill, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan, HealthRecord, Medication, Vital } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/ui'
import { SkylineScene } from '../components/illustrations'

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
      <div className="mb-10">
        <h1 className="font-display text-4xl font-medium leading-tight text-pine-900">
          Hello, {user?.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-[15px] text-stone-500">Here is where your care stands today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-teal-600/40">
              <span className="inline-flex rounded-xl bg-sage-100 p-2.5">
                <Icon className="h-5 w-5 text-pine-800" strokeWidth={1.8} />
              </span>
              <div className="mt-4 font-display text-3xl font-medium text-pine-900">{value}</div>
              <div className="mt-0.5 text-[13px] text-stone-500">{label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          {
            to: '/records',
            icon: Upload,
            title: 'Upload a prescription',
            text: 'Scan it, review the text, and turn it into a clear care plan.',
          },
          {
            to: '/assistant',
            icon: MessageCircle,
            title: 'Ask the AI assistant',
            text: 'Questions about your medicines, plan, or readings — answered in context.',
          },
        ].map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to}>
            <Card className="group flex h-full items-center gap-5 transition-all hover:-translate-y-0.5 hover:border-teal-600/40">
              <div className="rounded-2xl bg-pine-900 p-3.5">
                <Icon className="h-6 w-6 text-teal-300" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-medium text-pine-900">{title}</div>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-500">{text}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-stone-300 transition-all group-hover:translate-x-1 group-hover:text-teal-600" />
            </Card>
          </Link>
        ))}
      </div>

      {latestPlan && latestPlan.plan.red_flags.length > 0 && (
        <Card className="mt-8 !border-red-200 !bg-red-50">
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

      <div className="mt-14 overflow-hidden opacity-80">
        <SkylineScene className="mx-auto w-full min-w-[720px]" />
      </div>
      <p className="mt-4 text-center text-xs text-stone-400">
        Curastra supports your everyday care. It never diagnoses or replaces medical advice.
      </p>
    </div>
  )
}
