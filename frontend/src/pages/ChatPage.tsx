import { PageTitle } from '../components/ui'
import { ChatConversation } from '../components/ChatConversation'
import { useLang } from '../i18n/LanguageContext'

/** The headline feature: a context-aware assistant grounded in the user's own
 * medications, vitals, and care plan. The conversation itself lives in
 * ChatConversation, shared with the floating widget. */
export default function ChatPage() {
  const { t } = useLang()
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-6rem)]">
      <PageTitle title={t('chat.title')} subtitle={t('chat.sub')} />
      <ChatConversation withClear />
    </div>
  )
}
