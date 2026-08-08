import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, PhoneCall, Printer, ShieldAlert } from 'lucide-react'
import { api } from '../api/client'
import type { Medication } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { Button, Card, PageTitle } from '../components/ui'

interface Basics {
  blood_type: string | null
  allergies: string | null
  conditions: string | null
  date_of_birth: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

/** The ICE card: everything a first responder needs, plus confirmed calling. */
export default function EmergencyPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [basics, setBasics] = useState<Basics | null>(null)
  const [meds, setMeds] = useState<Medication[]>([])
  const [armed, setArmed] = useState<string | null>(null) // which call button awaits confirmation

  useEffect(() => {
    api.get<Basics>('/api/profile/health').then(setBasics).catch(() => {})
    api.get<Medication[]>('/api/medications').then(setMeds).catch(() => {})
  }, [])

  function CallButton({ id, number, label }: { id: string; number: string; label: string }) {
    const isArmed = armed === id
    if (isArmed) {
      return (
        <a
          href={`tel:${number.replace(/[\s-]/g, '')}`}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-red-700"
          onClick={() => setArmed(null)}
        >
          <PhoneCall className="h-5 w-5" /> {t('em.confirmCall')} · {number}
        </a>
      )
    }
    return (
      <button
        onClick={() => setArmed(id)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-red-600 bg-white px-5 py-3 text-[15px] font-semibold text-red-700 hover:bg-red-50"
      >
        <PhoneCall className="h-5 w-5" /> {label}
      </button>
    )
  }

  const rows: { label: string; value: string | null }[] = basics
    ? [
        { label: t('basics.blood'), value: basics.blood_type && basics.blood_type !== 'unknown' ? basics.blood_type : null },
        { label: t('basics.allergies'), value: basics.allergies },
        { label: t('basics.conditions'), value: basics.conditions },
        { label: t('basics.dob'), value: basics.date_of_birth },
      ]
    : []

  return (
    <div>
      <PageTitle title={t('em.title')} subtitle={t('em.sub')} />

      <Card className="!border-red-200">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-red-50 p-3">
            <ShieldAlert className="h-7 w-7 text-red-600" />
          </span>
          <div>
            <div className="text-lg font-semibold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-500">{t('em.cardNote')}</div>
          </div>
        </div>

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-2">
              <dt className="text-sm font-medium text-slate-500">{label}:</dt>
              <dd className="text-sm font-semibold text-slate-800">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <div className="text-sm font-medium text-slate-500">{t('nav.medications')}:</div>
          {meds.length === 0 ? (
            <div className="text-sm text-slate-400">—</div>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-2">
              {meds.map((m) => (
                <li key={m.id} className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-900">
                  <Droplets className="mr-1 inline h-3.5 w-3.5" />
                  {m.name}
                  {m.dosage ? ` ${m.dosage}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="mt-6 !border-red-200 print:hidden">
        <h2 className="font-semibold text-slate-800">{t('em.callTitle')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <CallButton id="112" number="112" label={t('em.callEmergency')} />
          {basics?.emergency_contact_phone ? (
            <CallButton
              id="contact"
              number={basics.emergency_contact_phone}
              label={t('em.callContact', { name: basics.emergency_contact_name || basics.emergency_contact_phone })}
            />
          ) : (
            <p className="self-center text-sm text-stone-500">
              {t('em.noContact')}{' '}
              <Link to="/profile" className="font-medium text-teal-700 hover:underline">
                {t('nav.profile')}
              </Link>
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-stone-400">{t('em.desktopNote')}</p>
      </Card>

      <div className="mt-4 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> {t('plans.print')}
        </Button>
      </div>
    </div>
  )
}
