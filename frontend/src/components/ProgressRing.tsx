import { useLang } from '../i18n/LanguageContext'

/** Animated circular progress indicator for daily adherence. */
export function ProgressRing({ done, total, title }: { done: number; total: number; title?: string }) {
  const { t } = useLang()
  const R = 26
  const C = 2 * Math.PI * R
  const fraction = total > 0 ? done / total : 0

  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${total} tasks done`}>
        <circle cx="32" cy="32" r={R} fill="none" stroke="#e8efe7" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="#0d9488"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fraction)}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="600" fill="#16342d">
          {done}/{total}
        </text>
      </svg>
      <div className="text-sm text-stone-500">
        <div className="font-medium text-pine-900">{title ?? t('plans.progress')}</div>
        {done === total && total > 0 ? t('plans.allDone') : t('plans.progressHint')}
      </div>
    </div>
  )
}
