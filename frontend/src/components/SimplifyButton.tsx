import { useState } from 'react'
import { Loader2, Sparkles, Volume2 } from 'lucide-react'
import { api } from '../api/client'
import type { SimplifyResult } from '../api/types'
import { Disclaimer } from './ui'

/**
 * "Explain in simple words" for any medical instruction, with a read-aloud
 * option (browser speech synthesis speaking the engine's tts_text).
 */
export function SimplifyButton({ text }: { text: string }) {
  const [result, setResult] = useState<SimplifyResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSimplify() {
    setBusy(true)
    setError('')
    try {
      setResult(await api.post<SimplifyResult>('/api/ai/simplify', { text }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not simplify.')
    } finally {
      setBusy(false)
    }
  }

  function speak() {
    if (!result) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.tts_text))
  }

  if (result) {
    return (
      <div className="mt-2 rounded-lg border border-teal-100 bg-teal-50/60 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-relaxed text-slate-700">{result.simplified}</p>
          <button
            onClick={speak}
            title="Read aloud"
            className="shrink-0 rounded-full p-1.5 text-teal-700 hover:bg-teal-100"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
        <Disclaimer text={result.disclaimer} />
      </div>
    )
  }

  return (
    <div className="mt-1">
      <button
        onClick={onSimplify}
        disabled={busy}
        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline disabled:text-slate-400"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {busy ? 'Simplifying…' : 'Explain in simple words'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </div>
  )
}
