import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { HeartPulse, MessageCircle, X } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { ChatConversation } from './ChatConversation'

/** The assistant, one tap away from every screen: a floating button that
 * slides in the exact same conversation as the Assistant page (shared
 * history, context grounding, safety banners, voice input). */
export function ChatWidget() {
  const { t } = useLang()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // Redundant on the Assistant page itself.
  if (location.pathname === '/assistant') return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={t('chat.widgetOpen')}
          aria-label={t('chat.widgetOpen')}
          className="group fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pine-900 text-white shadow-lg shadow-pine-900/25 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 motion-safe:hover:-translate-y-0.5"
        >
          <span className="absolute inset-0 rounded-full ring-4 ring-teal-600/15 transition-all group-hover:ring-8 group-hover:ring-teal-600/10" />
          <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-pine-900/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-stone-200 bg-stone-50 shadow-2xl motion-safe:animate-[slide-in_.25s_ease-out]">
            <div className="flex items-center justify-between bg-pine-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-white/10 p-2">
                  <HeartPulse className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <div className="font-display text-base leading-tight">{t('chat.widgetTitle')}</div>
                  <div className="text-xs text-white/60">{t('chat.widgetSub')}</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                title={t('chat.widgetClose')}
                aria-label={t('chat.widgetClose')}
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 px-4 pb-4">
              <ChatConversation withClear />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
