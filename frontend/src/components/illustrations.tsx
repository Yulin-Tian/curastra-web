/**
 * Hand-drawn flat illustrations in the Nordic public-sector style
 * (ruter.no / sio.no): simple geometry, calm colors, no gradients.
 * Everything is inline SVG in the app palette — no image files.
 */

const c = {
  pine: '#16342d',
  pineSoft: '#1d443b',
  teal: '#0d9488',
  tealLight: '#5eead4',
  sage: '#d7e3d6',
  sageLight: '#e8efe7',
  coral: '#e8907a',
  sand: '#eecfa1',
  sun: '#f2c94c',
  white: '#ffffff',
}

/** Wide skyline strip: hills, sun, houses with a small clinic, trees, a bus. */
export function SkylineScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 240" className={className} aria-hidden="true" role="presentation">
      {/* hills */}
      <path d="M0 196 Q 300 120 640 176 T 1440 150 L 1440 240 L 0 240 Z" fill={c.sage} opacity="0.55" />
      <path d="M0 214 Q 420 158 880 206 T 1440 196 L 1440 240 L 0 240 Z" fill={c.sageLight} />

      {/* sun + rays */}
      <circle cx="196" cy="72" r="24" fill={c.sun} />
      <g stroke={c.sun} strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <line x1="196" y1="30" x2="196" y2="18" />
        <line x1="196" y1="126" x2="196" y2="114" />
        <line x1="154" y1="72" x2="142" y2="72" />
        <line x1="250" y1="72" x2="238" y2="72" />
        <line x1="166" y1="42" x2="158" y2="34" />
        <line x1="234" y1="42" x2="242" y2="34" />
      </g>

      {/* clouds */}
      <rect x="360" y="52" width="86" height="18" rx="9" fill={c.white} opacity="0.9" />
      <rect x="396" y="38" width="52" height="16" rx="8" fill={c.white} opacity="0.9" />
      <rect x="1040" y="64" width="72" height="16" rx="8" fill={c.white} opacity="0.85" />

      {/* birds */}
      <path d="M520 84 q 8 -8 16 0 M536 84 q 8 -8 16 0" stroke={c.pine} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* small house, coral */}
      <g>
        <rect x="618" y="146" width="48" height="46" fill={c.coral} rx="2" />
        <polygon points="614,148 642,120 670,148" fill={c.pine} />
        <rect x="636" y="168" width="13" height="24" rx="1.5" fill={c.pine} opacity="0.85" />
        <rect x="626" y="156" width="10" height="10" rx="1.5" fill={c.white} opacity="0.9" />
      </g>

      {/* clinic with teal cross */}
      <g>
        <rect x="690" y="122" width="76" height="70" fill={c.white} rx="2" />
        <rect x="686" y="114" width="84" height="12" rx="2" fill={c.pine} />
        <rect x="716" y="136" width="24" height="8" rx="1.5" fill={c.teal} />
        <rect x="724" y="128" width="8" height="24" rx="1.5" fill={c.teal} />
        <rect x="700" y="164" width="12" height="12" rx="1.5" fill={c.sage} />
        <rect x="722" y="164" width="12" height="12" rx="1.5" fill={c.sage} />
        <rect x="744" y="164" width="12" height="12" rx="1.5" fill={c.sage} />
      </g>

      {/* tall sand house */}
      <g>
        <rect x="788" y="132" width="42" height="60" fill={c.sand} rx="2" />
        <polygon points="784,134 809,110 834,134" fill={c.pineSoft} />
        <rect x="796" y="144" width="9" height="9" rx="1.5" fill={c.white} />
        <rect x="812" y="144" width="9" height="9" rx="1.5" fill={c.white} />
        <rect x="796" y="160" width="9" height="9" rx="1.5" fill={c.white} />
        <rect x="812" y="160" width="9" height="9" rx="1.5" fill={c.white} />
      </g>

      {/* trees */}
      {[
        [480, 176, 16],
        [560, 184, 12],
        [900, 178, 15],
        [980, 188, 11],
        [1330, 176, 14],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 2.5} y={y} width="5" height="22" fill={c.pineSoft} rx="2" />
          <circle cx={x} cy={y - r * 0.6} r={r} fill={i % 2 ? c.teal : c.pine} opacity={i % 2 ? 0.75 : 0.9} />
        </g>
      ))}

      {/* little bus, a nod to the inspiration */}
      <g>
        <rect x="1128" y="158" width="84" height="36" rx="9" fill={c.teal} />
        <rect x="1136" y="166" width="16" height="12" rx="2.5" fill={c.white} opacity="0.92" />
        <rect x="1158" y="166" width="16" height="12" rx="2.5" fill={c.white} opacity="0.92" />
        <rect x="1180" y="166" width="16" height="12" rx="2.5" fill={c.white} opacity="0.92" />
        <circle cx="1146" cy="196" r="7" fill={c.pine} />
        <circle cx="1194" cy="196" r="7" fill={c.pine} />
      </g>
    </svg>
  )
}

/** Small sprout-in-pot spot illustration for empty states. */
export function SproutSpot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" role="presentation">
      <ellipse cx="48" cy="86" rx="26" ry="4" fill={c.sage} opacity="0.6" />
      <path d="M32 60 L64 60 L59 86 L37 86 Z" fill={c.coral} />
      <rect x="29" y="55" width="38" height="8" rx="3" fill={c.pine} opacity="0.9" />
      <path d="M48 55 C 48 42 48 36 48 30" stroke={c.pineSoft} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M48 40 C 38 40 32 34 31 25 C 41 25 47 31 48 40 Z" fill={c.teal} />
      <path d="M48 33 C 58 33 64 27 65 18 C 55 18 49 24 48 33 Z" fill={c.tealLight} />
    </svg>
  )
}
