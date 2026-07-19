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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <HeartPulse className="h-7 w-7 text-teal-600" />
          <div>
            <div className="text-lg font-bold tracking-tight text-slate-900">Curastra</div>
            <div className="text-[11px] text-slate-400 -mt-0.5">Everyday care, continued</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 truncate text-sm font-medium text-slate-700">{user?.name}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-teal-600" />
            <span className="font-bold text-slate-900">Curastra</span>
          </div>
          <button onClick={logout} className="text-sm text-slate-500">
            Sign out
          </button>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 flex justify-around border-t border-slate-200 bg-white py-1.5 sm:hidden">
          {navItems.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                  isActive ? 'text-teal-600' : 'text-slate-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
