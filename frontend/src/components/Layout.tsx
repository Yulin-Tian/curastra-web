import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pill,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/records', label: 'Records', icon: FileText },
  { to: '/care-plans', label: 'Care Plans', icon: ClipboardList },
  { to: '/medications', label: 'Medications', icon: Pill },
  { to: '/vitals', label: 'Vitals & Insights', icon: Activity },
  { to: '/assistant', label: 'AI Assistant', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-pine-900 text-sage-100 sm:flex">
        <div className="flex items-center gap-2.5 px-6 pb-8 pt-7">
          <HeartPulse className="h-7 w-7 text-teal-400" strokeWidth={1.8} />
          <div>
            <div className="font-display text-xl font-medium tracking-tight text-white">Curastra</div>
            <div className="-mt-0.5 text-[11px] tracking-wide text-sage-200/60">
              Everyday care, continued
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
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
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mx-3 mb-4 rounded-xl bg-white/5 p-4">
          <div className="mb-1.5 truncate text-sm font-medium text-white">{user?.name}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[13px] text-sage-200/60 transition-colors hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between bg-pine-900 px-4 py-3 text-white sm:hidden">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-teal-400" strokeWidth={1.8} />
            <span className="font-display text-lg font-medium">Curastra</span>
          </div>
          <button onClick={logout} className="text-sm text-sage-200/70">
            Sign out
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 flex justify-around border-t border-pine-800 bg-pine-900 py-1.5 sm:hidden">
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
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
