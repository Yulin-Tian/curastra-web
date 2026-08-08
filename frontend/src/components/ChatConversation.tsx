import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, MessageCircle, Mic, MicOff, Send, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { ChatMessage, ChatResult, SafetyFlag } from '../api/types'
import { BreathingCircle, Button, ErrorBanner, SkeletonList } from './ui'
import { useLang } from '../i18n/LanguageContext'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  safety_flag: SafetyFlag
}

/* Web Speech API: present in Chrome/Edge (desktop and Android), absent in
   Firefox — the mic button simply doesn't render there. */
function speechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

/** The full assistant conversation — history, sending, safety banners, voice
 * input, and suggestion chips. Used by both the Assistant page and the
 * floating widget so they are exactly the same assistant. */
export function ChatConversation({ withClear = false }: { withClear?: boolean }) {
  const { t, lang } = useLang()
  const [messages, setMessages] = useState<DisplayMessage[] | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const recogRef = useRef<SpeechRecognitionLike | null>(null)
  const voiceSupported = speechRecognition() !== null

  useEffect(() => {
    api
      .get<ChatMessage[]>('/api/chat/history')
      .then((history) =>
        setMessages(
          history.map((m) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            safety_flag: m.safety_flag,
          })),
        ),
      )
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load chat history.'))
    return () => recogRef.current?.stop()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function sendText(message: string) {
    if (!message || sending) return
    stopListening()
    setInput('')
    setError('')
    setSending(true)
    setMessages((prev) => [
      ...(prev ?? []),
      { id: `local-${Date.now()}`, role: 'user', content: message, safety_flag: null },
    ])
    try {
      const res = await api.post<ChatResult>('/api/chat', { message })
      setMessages((prev) => [
        ...(prev ?? []),
        { id: `local-${Date.now()}-a`, role: 'assistant', content: res.reply, safety_flag: res.safety_flag },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The assistant could not answer. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault()
    sendText(input.trim())
  }

  async function onClear() {
    if (!window.confirm(t('chat.clearConfirm'))) return
    try {
      await api.delete('/api/chat/history')
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear the history.')
    }
  }

  function stopListening() {
    recogRef.current?.stop()
    recogRef.current = null
    setListening(false)
  }

  function toggleVoice() {
    if (listening) {
      stopListening()
      return
    }
    const Recognition = speechRecognition()
    if (!Recognition) return
    const rec = new Recognition()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = true
    rec.continuous = false
    const base = input.trim() ? input.trim() + ' ' : ''
    rec.onresult = (e) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
      setInput(base + transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recogRef.current = rec
    setListening(true)
    rec.start()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ErrorBanner message={error} />

      {withClear && messages !== null && messages.length > 0 && (
        <div className="mt-1 flex justify-end">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('chat.clearBtn')}
          </button>
        </div>
      )}
      <div className="mt-1 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white p-5">
        {messages === null ? (
          <SkeletonList rows={2} />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="rounded-2xl bg-sage-100 p-4">
              <MessageCircle className="h-8 w-8 text-pine-800" strokeWidth={1.6} />
            </span>
            <p className="mt-4 font-display text-lg text-pine-900">{t('chat.empty')}</p>
            <div className="mt-4 flex max-w-md flex-wrap justify-center gap-2">
              {[t('chat.chip1'), t('chat.chip2'), t('chat.chip3'), t('chat.chip4')].map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  className="rounded-full border border-teal-600/30 bg-white px-3.5 py-1.5 text-[13px] text-teal-700 transition-all hover:-translate-y-0.5 hover:border-teal-600 hover:bg-teal-50 active:scale-[0.97]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              {m.safety_flag === 'advised_see_doctor' && (
                <div className="mb-1 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t('chat.seekHelp')}
                </div>
              )}
              <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-pine-900 text-white'
                      : 'rounded-bl-sm bg-sage-100 text-ink'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))
        )}
        {sending && <BreathingCircle label={t('common.thinking')} />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 pr-11 text-sm placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
            placeholder={listening ? t('chat.listening') : t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={4000}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              title={listening ? t('chat.voiceStop') : t('chat.voiceStart')}
              aria-label={listening ? t('chat.voiceStop') : t('chat.voiceStart')}
              aria-pressed={listening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors ${
                listening
                  ? 'animate-pulse bg-red-100 text-red-600'
                  : 'text-stone-400 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>
        <Button type="submit" disabled={sending || !input.trim()} aria-label={t('chat.sendLabel')}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-slate-400">{t('chat.disclaimer')}</p>
    </div>
  )
}
