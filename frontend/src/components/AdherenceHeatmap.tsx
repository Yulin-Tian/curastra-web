import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLang } from '../i18n/LanguageContext'

interface MonthData {
  month: string
  total_tasks: number
  days: Record<string, number>
}

/** GitHub-style month grid of task completion. Past days (and today) are
 * clickable so users can review — and fix — earlier days' ticks. */
export function AdherenceHeatmap({
  planId,
  selectedDay,
  onSelectDay,
  version = 0,
}: {
  planId: string
  selectedDay?: string
  onSelectDay?: (day: string) => void
  version?: number
}) {
  const { t, lang } = useLang()
  const [data, setData] = useState<MonthData | null>(null)

  useEffect(() => {
    api.get<MonthData>(`/api/care-plans/${planId}/adherence/month`).then(setData).catch(() => {})
  }, [planId, version])

  if (!data || data.total_tasks === 0) return null

  const [year, month] = data.month.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7 // Monday-first
  const today = new Date()
  const isThisMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  const cellFor = (day: number) => {
    const key = `${data.month}-${String(day).padStart(2, '0')}`
    const done = data.days[key] ?? 0
    const frac = Math.min(done / data.total_tasks, 1)
    const future = isThisMonth && day > today.getDate()
    const isToday = isThisMonth && day === today.getDate()
    const isSelected = selectedDay === key
    const bg =
      frac >= 1 ? 'bg-teal-600' : frac >= 0.67 ? 'bg-teal-500/80' : frac >= 0.34 ? 'bg-teal-400/60' : frac > 0 ? 'bg-teal-300/50' : 'bg-sage-100'

    if (future) {
      return (
        <div key={day} className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] text-stone-300">
          {day}
        </div>
      )
    }
    return (
      <button
        key={day}
        type="button"
        onClick={() => onSelectDay?.(key)}
        title={`${key}: ${done}/${data.total_tasks}`}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] transition-transform hover:scale-110 active:scale-95 ${bg} ${
          frac > 0.5 ? 'text-white' : 'text-pine-900/60'
        } ${isSelected ? 'ring-2 ring-teal-600' : isToday ? 'ring-2 ring-pine-800/50' : ''}`}
      >
        {day}
      </button>
    )
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(lang === 'hi' ? 'hi-IN' : undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mt-4 print:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{t('plans.monthTitle')}</h3>
        <span className="text-xs text-stone-400">{monthLabel}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" style={{ maxWidth: '15.5rem' }}>
        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => cellFor(i + 1))}
      </div>
    </div>
  )
}
