import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  FileText,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pill,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import { api, getActiveProfileId, switchProfile } from '../api/client'
import { Tour } from './Tour'
import { useLang } from '../i18n/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { ProfileInfo } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/records', label: 'nav.records', icon: FileText },
  { to: '/care-plans', label: 'nav.carePlans', icon: ClipboardList },
  { to: '/medications', label: 'nav.medications', icon: Pill },
  { to: '/vitals', label: 'nav.vitals', icon: Activity },
  { to: '/assistant', label: 'nav.assistant', icon: MessageCircle },
  { to: '/emergency', label: 'nav.emergency', icon: ShieldAlert },
  { to: '/profile', label: 'nav.profile', icon: UserRound },
]

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()
  const { t } = useLang()
  const relationshipLabels: Record<string, string> = {
    self: t('chrome.me'),
    child: t('chrome.child'),
    parent: t('chrome.parent'),
    other: t('chrome.other'),
  }
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    api.get<ProfileInfo[]>('/api/profiles').then(setProfiles).catch(() => {})
  }, [])

  // First-run guided tour: desktop only, once per browser, from the dashboard.
  useEffect(() => {
    if (
      location.pathname === '/dashboard' &&
      !localStorage.getItem('curastra_tour_done') &&
      window.innerWidth >= 640
    ) {
      const timer = setTimeout(() => setShowTour(true), 900)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  const activeId = getActiveProfileId()
  const active =
    profiles.find((p) => String(p.id) === activeId) ?? profiles.find((p) => p.is_primary) ?? null
  const caringForOther = active !== null && !active.is_primary

  const chipColors: Record<string, string> = {
    self: 'bg-teal-500 text-white',
    child: 'bg-[#6d8fe8] text-white',
    parent: 'bg-[#c98a6b] text-white',
    other: 'bg-sage-200 text-pine-900',
  }

  const switcher = profiles.length > 1 && (
    <div className="mx-3 mb-3 rounded-2xl bg-white/5 p-2">
      <div className="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage-200/50">
        {t('chrome.caringFor')}
      </div>
      <div className="space-y-1">
        {profiles.map((p) => {
          const isActive = active?.id === p.id
          return (
            <button
              key={p.id}
              onClick={() => !isActive && switchProfile(p.id, p.relationship, p.is_primary)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all ${
                isActive ? 'bg-white/15 ring-1 ring-teal-300/40' : 'hover:bg-white/10 active:scale-[0.98]'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                  chipColors[p.relationship] ?? chipColors.other
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-white">{p.name}</span>
                <span className="block text-[11px] text-sage-200/60">
                  {p.is_primary ? t('chrome.me') : relationshipLabels[p.relationship] ?? p.relationship}
                </span>
              </span>
              {isActive && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-teal-300" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {showTour && <Tour onClose={() => setShowTour(false)} />}
      <aside className="hidden w-64 shrink-0 flex-col bg-pine-900 text-sage-100 print:hidden sm:flex">
        <div className="flex items-center gap-2.5 px-6 pb-8 pt-7">
          <HeartPulse className="anim-heartbeat h-7 w-7 text-teal-400" strokeWidth={1.8} />
          <div>
            <div className="font-display text-xl font-medium tracking-tight text-white">Curastra</div>
            <div className="-mt-0.5 text-[11px] tracking-wide text-sage-200/60">
              {t('chrome.tagline')}
            </div>
          </div>
        </div>
        {switcher}
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              id={'tour' + to.replace('/', '-')}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-sage-200/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {t(label)}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-sage-200/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {t('nav.signout')}
          </button>
          <div id="tour-lang" className="mt-6 flex justify-start pl-2.5">
            <LanguageSwitcher tone="dark" />
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between bg-pine-900 px-4 py-3 text-white print:hidden sm:hidden">
          <div className="flex items-center gap-2">
            <HeartPulse className="anim-heartbeat h-6 w-6 text-teal-400" strokeWidth={1.8} />
            <span className="font-display text-lg font-medium">Curastra</span>
          </div>
          <button onClick={logout} className="text-sm text-sage-200/70">
            {t('nav.signout')}
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 print:max-w-none print:px-0 print:py-0 sm:px-10">
          {caringForOther && active && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-sage-100 px-4 py-2.5 text-sm text-pine-900 print:hidden">
              <HeartHandshake className="h-4 w-4 shrink-0 text-pine-800" strokeWidth={1.8} />
              {t('chrome.viewingBanner', { name: active.name, rel: relationshipLabels[active.relationship] ?? active.relationship })}
            </div>
          )}
          <div key={location.pathname} className="anim-page">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 flex justify-around border-t border-pine-800 bg-pine-900 py-1.5 print:hidden sm:hidden">
          {navItems.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                  isActive ? 'text-teal-300' : 'text-sage-200/60'
                }`
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              {t(label).split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
