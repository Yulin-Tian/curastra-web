import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CheckCircle2, Circle, ClipboardList, FileText, MessageCircle, Pill, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { CarePlan, HealthRecord, Medication, Vital } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/ui'
import { SkylineScene } from '../components/illustrations'

interface BasicsProbe {
  allergies: string | null
  date_of_birth: string | null
  height_cm: string | null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [plans, setPlans] = useState<CarePlan[]>([])
  const [meds, setMeds] = useState<Medication[]>([])
  const [vitals, setVitals] = useState<Vital[]>([])
  const [hasBasics, setHasBasics] = useState<boolean | null>(null)
  const [loadedCore, setLoadedCore] = useState(false)

  useEffect(() => {
    // Best-effort loads; the dashboard should render even if one call fails.
    Promise.allSettled([
      api.get<HealthRecord[]>('/api/records').then(setRecords),
      api.get<CarePlan[]>('/api/care-plans').then(setPlans),
    ]).then(() => setLoadedCore(true))
    api.get<Medication[]>('/api/medications').then(setMeds).catch(() => {})
    api.get<Vital[]>('/api/vitals?limit=1').then(setVitals).catch(() => {})
    api
      .get<BasicsProbe>('/api/profile/health')
      .then((b) => setHasBasics(Boolean(b.allergies || b.date_of_birth || b.height_cm)))
      .catch(() => setHasBasics(null))
  }, [])

  const steps = [
    { done: hasBasics === true, label: 'Add your health basics', hint: 'Allergies and conditions tailor your care plans.', to: '/profile' },
    { done: records.length > 0, label: 'Upload a prescription', hint: 'A photo is enough. You review every extracted word.', to: '/records' },
    { done: plans.length > 0, label: 'Generate your first care plan', hint: 'Confirm the text and the plan builds itself.', to: records.length > 0 ? `/records/${records[0].id}` : '/records' },
    { done: false, label: 'Ask the assistant anything', hint: 'It knows your plan, medicines, and readings.', to: '/assistant' },
  ]
  const showChecklist = loadedCore && !(hasBasics && records.length > 0 && plans.length > 0)

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

      {showChecklist && (
        <Card className="mb-6 !border-teal-600/25">
          <h2 className="font-display text-lg font-medium text-pine-900">Getting started</h2>
          <p className="mt-0.5 text-sm text-stone-500">Three small steps and Curastra starts working for you.</p>
          <ul className="mt-4 space-y-1">
            {steps.map(({ done, label, hint, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    done ? 'opacity-60' : 'hover:bg-sage-50'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-stone-300" />
                  )}
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${done ? 'text-stone-500 line-through decoration-teal-600/40' : 'text-pine-900'}`}>
                      {label}
                    </span>
                    {!done && <span className="block text-xs text-stone-400">{hint}</span>}
                  </span>
                  {!done && <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-stone-300" />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

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
            text: 'Questions about your medicines, plan, or readings, answered in context.',
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
          <div className="font-semibold text-red-700">Warning signs from your latest care plan</div>
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
