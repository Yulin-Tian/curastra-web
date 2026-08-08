import { useEffect, useState } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { Button } from './ui'

const STEPS: { target: string | null; title: string; text: string }[] = [
  { target: null, title: 'tour.welcomeTitle', text: 'tour.welcomeText' },
  { target: 'tour-records', title: 'nav.records', text: 'tour.recordsText' },
  { target: 'tour-care-plans', title: 'nav.carePlans', text: 'tour.plansText' },
  { target: 'tour-assistant', title: 'nav.assistant', text: 'tour.assistantText' },
  { target: 'tour-vitals', title: 'nav.vitals', text: 'tour.vitalsText' },
  { target: 'tour-lang', title: 'tour.langTitle', text: 'tour.langText' },
]

/** First-run spotlight walkthrough of the sidebar's key features. */
export function Tour({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]
  const last = step === STEPS.length - 1

  useEffect(() => {
    if (!current.target) {
      setRect(null)
      return
    }
    const el = document.getElementById(current.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [current.target])

  function finish() {
    localStorage.setItem('curastra_tour_done', '1')
    onClose()
  }

  const pad = 6
  const tooltipTop = rect ? Math.min(Math.max(rect.top - 10, 16), window.innerHeight - 220) : undefined

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Dimmer: either a spotlight cut-out around the target, or a full veil */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-teal-300"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(15, 38, 34, 0.62)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-pine-950/70" />
      )}

      {/* Tooltip card */}
      <div
        className="anim-fade-up fixed w-80 rounded-2xl bg-white p-5 shadow-2xl"
        style={
          rect
            ? { left: Math.min(rect.right + 18, window.innerWidth - 340), top: tooltipTop }
            : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          {step + 1} / {STEPS.length}
        </div>
        <h3 className="mt-1 font-display text-xl font-medium text-pine-900">{t(current.title)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{t(current.text)}</p>
        <div className="mt-4 flex items-center gap-2">
          {step > 0 && (
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setStep(step - 1)}>
              {t('tour.back')}
            </Button>
          )}
          <Button className="!px-3 !py-1.5 text-xs" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? t('tour.done') : t('tour.next')}
          </Button>
          {!last && (
            <button onClick={finish} className="ml-auto text-xs text-stone-400 hover:text-stone-600">
              {t('tour.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
