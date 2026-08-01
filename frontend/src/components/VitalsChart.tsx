import type { Vital } from '../api/types'

/**
 * Dependency-free SVG line chart with a draw-in animation.
 * Blood pressure plots two lines (systolic/diastolic); everything else one.
 */

interface Series {
  label: string
  color: string
  values: number[]
}

function buildSeries(vitals: Vital[]): { series: Series[]; labels: string[] } {
  const asc = [...vitals].reverse() // API returns newest first
  const labels = asc.map((v) =>
    new Date(v.measured_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  )
  if (asc[0]?.type === 'blood_pressure') {
    const sys: number[] = []
    const dia: number[] = []
    for (const v of asc) {
      const [s, d] = v.value.split('/').map((x) => parseFloat(x))
      sys.push(Number.isFinite(s) ? s : NaN)
      dia.push(Number.isFinite(d) ? d : NaN)
    }
    return {
      series: [
        { label: 'Systolic', color: '#0d9488', values: sys },
        { label: 'Diastolic', color: '#e8907a', values: dia },
      ],
      labels,
    }
  }
  return {
    series: [{ label: '', color: '#0d9488', values: asc.map((v) => parseFloat(v.value)) }],
    labels,
  }
}

const W = 640
const H = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 40 }

export function VitalsChart({ vitals, unit }: { vitals: Vital[]; unit: string }) {
  const { series, labels } = buildSeries(vitals)
  const all = series.flatMap((s) => s.values).filter(Number.isFinite)
  if (all.length < 2) return null

  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const lo = min - span * 0.15
  const hi = max + span * 0.15

  const x = (i: number) =>
    PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(labels.length - 1, 1)
  const y = (v: number) => PAD.top + ((hi - v) * (H - PAD.top - PAD.bottom)) / (hi - lo)

  const toPath = (values: number[]) =>
    values
      .map((v, i) => (Number.isFinite(v) ? `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}` : ''))
      .join(' ')

  const gridValues = [min, (min + max) / 2, max]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Vitals over time">
        {gridValues.map((gv) => (
          <g key={gv}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(gv)}
              y2={y(gv)}
              stroke="#e7e5e4"
              strokeDasharray="3 5"
            />
            <text x={PAD.left - 8} y={y(gv) + 4} textAnchor="end" fontSize="11" fill="#a8a29e">
              {Math.round(gv)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <path
            key={s.label}
            d={toPath(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className="chart-line"
          />
        ))}
        {series.map((s) =>
          s.values.map((v, i) =>
            Number.isFinite(v) ? (
              <circle key={`${s.label}-${i}`} cx={x(i)} cy={y(v)} r="3.5" fill={s.color} className="chart-dot" />
            ) : null,
          ),
        )}
        <text x={PAD.left} y={H - 6} fontSize="11" fill="#a8a29e">
          {labels[0]}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="11" fill="#a8a29e">
          {labels[labels.length - 1]}
        </text>
      </svg>
      <div className="mt-1 flex items-center gap-4 text-xs text-stone-500">
        <span>{unit}</span>
        {series.length > 1 &&
          series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
      </div>
    </div>
  )
}
