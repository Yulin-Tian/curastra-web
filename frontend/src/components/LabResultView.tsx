import type { LabAnalyzeResult, LabFlag } from '../api/types'

const statusStyles: Record<LabFlag['status'], string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  high: 'bg-red-50 text-red-700 border-red-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  borderline: 'bg-amber-50 text-amber-700 border-amber-200',
  unknown: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function LabResultView({ result }: { result: LabAnalyzeResult }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-800">Lab report, explained</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{result.summary}</p>
      {result.flags.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.flags.map((flag, i) => (
            <li
              key={`${flag.name}-${i}`}
              className={`rounded-lg border px-3 py-2 text-sm ${statusStyles[flag.status]}`}
            >
              <span className="font-medium">{flag.name}</span>
              {flag.value && <span> — {flag.value}</span>}
              <span className="ml-2 rounded-full bg-white/60 px-2 py-0.5 text-xs uppercase tracking-wide">
                {flag.status}
              </span>
              {flag.note && <p className="mt-1 text-xs opacity-80">{flag.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
