import type { ReactNode } from 'react'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import { SproutSpot } from './illustrations'

/** Loading state for AI/OCR calls — these take a few seconds, the UI must never look frozen. */
export function Spinner({ label = 'Working…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-4 text-stone-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/** Every AI result carries a disclaimer. It is always shown — this is a healthcare app. */
export function Disclaimer({ text }: { text: string }) {
  if (!text) return null
  return (
    <p className="mt-4 flex items-start gap-1.5 border-t border-stone-200/70 pt-3 text-xs leading-relaxed text-stone-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sage-200 bg-sage-50/60 px-6 py-12 text-center">
      <SproutSpot className="mx-auto h-20 w-20" />
      <p className="mt-3 font-display text-lg text-pine-900">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-500">{hint}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(31,45,41,0.04)] ${className}`}
    >
      {children}
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
  eyebrow,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-[2rem] font-medium leading-tight text-pine-900">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-500">{subtitle}</p>}
    </div>
  )
}

const buttonStyles = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-300 focus-visible:outline-teal-600',
  secondary:
    'bg-white text-pine-900 border border-stone-300 hover:border-pine-800 hover:bg-sage-50 disabled:text-stone-300',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:text-red-300',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15 transition-shadow'
