import type { ReactNode } from 'react'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'

/** Loading state for AI/OCR calls — these take a few seconds, the UI must never look frozen. */
export function Spinner({ label = 'Working…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 py-4" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/** Every AI result carries a disclaimer. It is always shown — this is a healthcare app. */
export function Disclaimer({ text }: { text: string }) {
  if (!text) return null
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}

const buttonStyles = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-300 focus-visible:outline-teal-600',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-300',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:text-red-300',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
