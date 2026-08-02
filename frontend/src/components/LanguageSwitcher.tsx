import { useLang } from '../i18n/LanguageContext'

/** Round flags drawn as SVG (emoji flags do not render on Windows). */
function FlagIndia({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <clipPath id="flagclip-in">
        <circle cx="12" cy="12" r="11" />
      </clipPath>
      <g clipPath="url(#flagclip-in)">
        <rect width="24" height="8" fill="#f49a48" />
        <rect y="8" width="24" height="8" fill="#ffffff" />
        <rect y="16" width="24" height="8" fill="#3d8f4e" />
        <circle cx="12" cy="12" r="3" fill="none" stroke="#26418f" strokeWidth="0.9" />
        <g stroke="#26418f" strokeWidth="0.6">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6
            return (
              <line
                key={i}
                x1={12}
                y1={12}
                x2={12 + 3 * Math.cos(a)}
                y2={12 + 3 * Math.sin(a)}
              />
            )
          })}
        </g>
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </svg>
  )
}

function FlagUK({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <clipPath id="flagclip-uk">
        <circle cx="12" cy="12" r="11" />
      </clipPath>
      <g clipPath="url(#flagclip-uk)">
        <rect width="24" height="24" fill="#2a3d7c" />
        <path d="M0 0 L24 24 M24 0 L0 24" stroke="#ffffff" strokeWidth="4.5" />
        <path d="M0 0 L24 24 M24 0 L0 24" stroke="#d5473f" strokeWidth="2" />
        <path d="M12 0 V24 M0 12 H24" stroke="#ffffff" strokeWidth="7" />
        <path d="M12 0 V24 M0 12 H24" stroke="#d5473f" strokeWidth="3.5" />
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </svg>
  )
}

/**
 * English/Hindi toggle. `tone="dark"` for the pine sidebar, default for
 * light surfaces (landing nav).
 */
export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { lang, setLang } = useLang()
  const base =
    tone === 'dark'
      ? { on: 'bg-white/15 text-white ring-1 ring-teal-300/40', off: 'text-sage-200/70 hover:bg-white/10' }
      : { on: 'bg-sage-100 text-pine-900 ring-1 ring-teal-600/30', off: 'text-stone-500 hover:bg-sage-50' }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      <button
        onClick={() => setLang('en')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${lang === 'en' ? base.on : base.off}`}
      >
        <FlagUK className="h-4.5 w-4.5" /> EN
      </button>
      <button
        onClick={() => setLang('hi')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${lang === 'hi' ? base.on : base.off}`}
      >
        <FlagIndia className="h-4.5 w-4.5" /> हिं
      </button>
    </div>
  )
}
