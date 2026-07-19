import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, MessageCircle, Send, Trash2 } from 'lucide-react'
import { api } from '../api/client'
import type { ChatMessage, ChatResult, SafetyFlag } from '../api/types'
import { Button, ErrorBanner, Spinner, PageTitle } from '../components/ui'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  safety_flag: SafetyFlag
}

const DISCLAIMER =
  'The assistant gives general guidance only — it does not diagnose or replace your doctor.'

/** The headline feature: a context-aware assistant grounded in the user's own
 * medications, vitals, and care plan. An "advised_see_doctor" safety flag from
 * the engine renders as a prominent red banner. */
export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[] | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    const message = input.trim()
    if (!message || sending) return
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

  async function onClear() {
    if (!window.confirm('Clear the whole conversation?')) return
    try {
      await api.delete('/api/chat/history')
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear the history.')
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-6rem)]">
      <div className="flex items-start justify-between">
        <PageTitle title="AI Health Assistant" subtitle="Ask about your medications, plan, or readings." />
        {messages && messages.length > 0 && (
          <button onClick={onClear} title="Clear conversation" className="mt-1 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <ErrorBanner message={error} />

      <div className="mt-2 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-stone-200/80 bg-white p-5">
        {messages === null ? (
          <Spinner label="Loading conversation…" />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="rounded-2xl bg-sage-100 p-4">
              <MessageCircle className="h-8 w-8 text-pine-800" strokeWidth={1.6} />
            </span>
            <p className="mt-4 font-display text-lg text-pine-900">Ask me anything about your care</p>
            <p className="mt-1 max-w-xs text-sm text-stone-400">
              For example: “When should I take my medicines?” or “What does my care plan say about diet?”
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              {m.safety_flag === 'advised_see_doctor' && (
                <div className="mb-1 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Please seek medical help — contact a doctor or emergency services.
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
        {sending && <Spinner label="Thinking…" />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={4000}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-slate-400">{DISCLAIMER}</p>
    </div>
  )
}
