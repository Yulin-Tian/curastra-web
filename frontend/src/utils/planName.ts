import type { CarePlan } from '../api/types'

/** The suggested display name for a plan: medications, else a condition from
 * the structured summary, else the first task shortened to a title-sized
 * phrase. Mirrors the backend's suggest_title, so legacy plans (created
 * before names were stored) get the same suggestion client-side. */
export function suggestPlanName(p: CarePlan): string | null {
  const names = p.plan.medications.map((m) => m.name).filter(Boolean) as string[]
  if (names.length > 0) {
    const shown = names.slice(0, 2).join(' + ')
    return names.length > 2 ? `${shown} +${names.length - 2}` : shown
  }
  const summary = p.plan.structured_summary ?? {}
  for (const key of ['condition', 'diagnosis', 'chief_complaint', 'reason', 'summary']) {
    const v = summary[key]
    if (typeof v === 'string' && v.trim() && v.length <= 60) return v.trim()
  }
  const first = p.plan.tasks[0]?.instruction
  if (!first) return null
  if (first.length <= 44) return first.replace(/[.;,\s]+$/, '')
  const cut = first.slice(0, 44)
  const atWord = cut.slice(0, cut.lastIndexOf(' '))
  return atWord.replace(/[.;,\s]+$/, '') + '…'
}
