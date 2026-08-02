import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

/** Honest banner while a sleeping free-tier server wakes up. */
export function ColdStartNotice() {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => setVisible(true)
    const hide = () => setVisible(false)
    window.addEventListener('curastra:slow-request', show)
    window.addEventListener('curastra:request-settled', hide)
    return () => {
      window.removeEventListener('curastra:slow-request', show)
      window.removeEventListener('curastra:request-settled', hide)
    }
  }, [])

  if (!visible) return null
  return (
    <div className="anim-fade-up fixed bottom-5 left-1/2 z-50 -translate-x-1/2 print:hidden">
      <div className="flex items-center gap-2.5 rounded-full bg-pine-900 px-5 py-2.5 text-sm text-white shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
        {t('common.coldStart')}
      </div>
    </div>
  )
}
