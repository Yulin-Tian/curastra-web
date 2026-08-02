/**
 * Hand-drawn flat illustrations in the Nordic public-sector style
 * (ruter.no / sio.no): simple geometry, calm colors, no gradients.
 * Everything is inline SVG in the app palette — no image files.
 */

const palettes = {
  self: {
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
  },
  child: {
    pine: '#27367a',
    pineSoft: '#33459a',
    teal: '#4f74d9',
    tealLight: '#9db8f0',
    sage: '#d4ddf1',
    sageLight: '#e7ecf8',
    coral: '#ef8a76',
    sand: '#f2cf9a',
    sun: '#f6c445',
    white: '#ffffff',
  },
  parent: {
    pine: '#4a3242',
    pineSoft: '#5d4254',
    teal: '#8a9b6e',
    tealLight: '#c3cfa8',
    sage: '#e2d5c3',
    sageLight: '#efe7db',
    coral: '#c98a6b',
    sand: '#e6c9a2',
    sun: '#e8a94c',
    white: '#ffffff',
  },
} as const

export type SceneVariant = keyof typeof palettes

/** Wide skyline strip: hills, sun, houses with a small clinic, trees, a bus.
 * The variant re-colors the scene and adds a signature element: a kite for
 * the child theme, a bench for the parent theme. */
export function SkylineScene({
  className = '',
  variant = 'self',
}: {
  className?: string
  variant?: SceneVariant
}) {
  const c = palettes[variant]
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

      {variant === 'child' && (
        <g>
          {/* kite on a swooping string */}
          <path d="M 1040 150 Q 1090 120 1108 66" stroke={c.pine} strokeWidth="2" fill="none" opacity="0.55" />
          <polygon points="1108,44 1128,66 1108,88 1088,66" fill={c.coral} />
          <path d="M 1108 88 q 6 10 -4 14 q 10 2 6 14" stroke={c.coral} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* drifting balloon */}
          <circle cx="330" cy="96" r="14" fill={c.teal} opacity="0.85" />
          <path d="M330 110 q 4 14 -2 26" stroke={c.pine} strokeWidth="1.8" fill="none" opacity="0.5" />
        </g>
      )}

      {variant === 'parent' && (
        <g>
          {/* park bench under the last tree */}
          <rect x="1272" y="176" width="46" height="6" rx="2.5" fill={c.pineSoft} />
          <rect x="1272" y="162" width="46" height="5" rx="2.5" fill={c.pineSoft} />
          <rect x="1276" y="176" width="4" height="18" fill={c.pineSoft} />
          <rect x="1310" y="176" width="4" height="18" fill={c.pineSoft} />
          {/* warm dusk glow */}
          <circle cx="196" cy="72" r="34" fill={c.sun} opacity="0.18" />
        </g>
      )}
    </svg>
  )
}

/**
 * Flat-style human figures in each theme's palette (SiO/Ruter spirit:
 * geometric bodies, round-cap stroke limbs, no faces).
 *  self   — an adult striding ahead, care plan in hand
 *  child  — a parent and a small child walking hand in hand, balloon aloft
 *  parent — an elder with a cane, a companion's arm around their back
 */
export function FamilyFigure({
  variant,
  className = '',
}: {
  variant: SceneVariant
  className?: string
}) {
  const c = palettes[variant]
  const limb = { strokeLinecap: 'round' as const, fill: 'none' as const }

  if (variant === 'child') {
    return (
      <svg viewBox="0 0 300 230" className={className} aria-hidden="true" role="presentation">
        <ellipse cx="150" cy="216" rx="95" ry="7" fill={c.sage} opacity="0.7" />
        {/* balloon */}
        <path d="M232 118 Q 240 80 228 58" stroke={c.pine} strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="226" cy="44" r="15" fill={c.coral} />
        {/* adult */}
        <path d="M118 128 L104 176 L96 208" stroke={c.pine} strokeWidth="11" {...limb} />
        <path d="M126 128 L140 172 L148 206" stroke={c.pine} strokeWidth="11" {...limb} />
        <rect x="100" y="62" width="46" height="74" rx="22" fill={c.teal} />
        <path d="M112 84 L88 122" stroke={c.teal} strokeWidth="10" {...limb} />
        <path d="M136 86 L172 122" stroke={c.teal} strokeWidth="10" {...limb} />
        <circle cx="123" cy="40" r="17" fill="#eeb98f" />
        <path d="M106 36 a17 17 0 0 1 34 -2 l-4 -12 h-26 Z" fill={c.pine} />
        {/* child */}
        <path d="M204 162 L198 190 L194 208" stroke={c.pineSoft} strokeWidth="9" {...limb} />
        <path d="M212 162 L220 188 L224 206" stroke={c.pineSoft} strokeWidth="9" {...limb} />
        <rect x="194" y="120" width="30" height="48" rx="15" fill={c.coral} />
        <path d="M200 132 L174 122" stroke={c.coral} strokeWidth="8" {...limb} />
        <path d="M220 130 L232 118" stroke={c.coral} strokeWidth="8" {...limb} />
        <circle cx="209" cy="104" r="12" fill="#f2c9a4" />
        <path d="M197 102 a12 12 0 0 1 24 -2 l-3 -8 h-18 Z" fill={c.pineSoft} />
        {/* joined hands */}
        <circle cx="173" cy="122" r="5" fill="#eeb98f" />
      </svg>
    )
  }

  if (variant === 'parent') {
    return (
      <svg viewBox="0 0 300 230" className={className} aria-hidden="true" role="presentation">
        <ellipse cx="150" cy="216" rx="95" ry="7" fill={c.sage} opacity="0.7" />
        {/* companion (behind) */}
        <path d="M110 130 L98 176 L92 208" stroke={c.pineSoft} strokeWidth="11" {...limb} />
        <path d="M118 130 L128 174 L134 206" stroke={c.pineSoft} strokeWidth="11" {...limb} />
        <rect x="92" y="64" width="46" height="74" rx="22" fill={c.teal} />
        <path d="M104 86 L82 124" stroke={c.teal} strokeWidth="10" {...limb} />
        {/* arm around the elder's back */}
        <path d="M130 84 Q 162 78 182 96" stroke={c.teal} strokeWidth="10" {...limb} />
        <circle cx="115" cy="42" r="17" fill="#caa27e" />
        <path d="M98 38 a17 17 0 0 1 34 -2 l-4 -12 h-26 Z" fill={c.pine} />
        {/* elder, slightly stooped */}
        <path d="M196 138 L188 178 L184 208" stroke={c.pine} strokeWidth="11" {...limb} />
        <path d="M206 138 L216 176 L222 206" stroke={c.pine} strokeWidth="11" {...limb} />
        <rect x="182" y="82" width="44" height="66" rx="21" fill={c.sand} transform="rotate(6 204 115)" />
        {/* scarf */}
        <path d="M188 96 Q 206 104 222 98" stroke={c.coral} strokeWidth="9" {...limb} />
        <path d="M226 108 L248 150" stroke={c.sand} strokeWidth="10" {...limb} />
        <circle cx="212" cy="64" r="16" fill="#e8c39e" />
        <path d="M196 62 a16 16 0 0 1 32 -4 l-6 -8 h-22 Z" fill="#cfd4d6" />
        {/* cane */}
        <path d="M248 152 L252 210" stroke={c.pineSoft} strokeWidth="5" {...limb} />
        <path d="M242 150 Q 250 146 254 152" stroke={c.pineSoft} strokeWidth="5" {...limb} />
      </svg>
    )
  }

  // self
  return (
    <svg viewBox="0 0 300 230" className={className} aria-hidden="true" role="presentation">
      <ellipse cx="150" cy="216" rx="80" ry="7" fill={c.sage} opacity="0.7" />
      {/* stride */}
      <path d="M142 132 L118 176 L104 206" stroke={c.pine} strokeWidth="11" {...limb} />
      <path d="M154 132 L176 172 L192 202" stroke={c.pine} strokeWidth="11" {...limb} />
      <rect x="124" y="60" width="48" height="78" rx="23" fill={c.teal} />
      {/* back arm swinging */}
      <path d="M134 84 L106 118" stroke={c.teal} strokeWidth="10" {...limb} />
      {/* front arm holding the plan */}
      <path d="M162 86 L196 108" stroke={c.teal} strokeWidth="10" {...limb} />
      <rect x="188" y="94" width="26" height="34" rx="3" fill={c.white} stroke={c.pine} strokeWidth="2.5" />
      <line x1="193" y1="104" x2="209" y2="104" stroke={c.tealLight} strokeWidth="3" strokeLinecap="round" />
      <line x1="193" y1="112" x2="209" y2="112" stroke={c.sage} strokeWidth="3" strokeLinecap="round" />
      <line x1="193" y1="120" x2="204" y2="120" stroke={c.sage} strokeWidth="3" strokeLinecap="round" />
      <circle cx="148" cy="38" r="17" fill="#eeb98f" />
      <path d="M131 34 a17 17 0 0 1 34 -2 l-4 -12 h-26 Z" fill={c.pine} />
      {/* little bag */}
      <path d="M136 92 L132 118" stroke={c.pineSoft} strokeWidth="3" />
      <rect x="122" y="116" width="22" height="18" rx="5" fill={c.coral} />
    </svg>
  )
}

/**
 * The handover: a clinician passes the prescription to a patient — the
 * moment the visit ends and Curastra's job begins. Hero illustration.
 */
export function HandoverScene({ className = '' }: { className?: string }) {
  const c = palettes.self
  const limb = { strokeLinecap: 'round' as const, fill: 'none' as const }
  return (
    <svg viewBox="0 0 340 230" className={className} aria-hidden="true" role="presentation">
      <ellipse cx="170" cy="216" rx="120" ry="7" fill={c.sage} opacity="0.7" />
      {/* clinician (left), white coat */}
      <path d="M96 134 L86 178 L80 208" stroke={c.pine} strokeWidth="11" {...limb} />
      <path d="M106 134 L114 176 L120 206" stroke={c.pine} strokeWidth="11" {...limb} />
      <rect x="78" y="62" width="48" height="80" rx="23" fill={c.white} stroke={c.sage} strokeWidth="2" />
      <rect x="96" y="66" width="12" height="46" fill={c.tealLight} opacity="0.5" />
      {/* extended arm with the prescription */}
      <path d="M118 86 L158 104" stroke={c.white} strokeWidth="10" {...limb} />
      <path d="M118 88 L157 105" stroke={c.sage} strokeWidth="1.5" fill="none" />
      <path d="M90 88 L74 124" stroke={c.white} strokeWidth="10" {...limb} />
      <circle cx="101" cy="40" r="17" fill="#caa27e" />
      <path d="M84 36 a17 17 0 0 1 34 -2 l-4 -12 h-26 Z" fill={c.pineSoft} />
      {/* the prescription, mid-pass */}
      <rect x="152" y="92" width="30" height="40" rx="3" fill={c.white} stroke={c.pine} strokeWidth="2.5" transform="rotate(8 167 112)" />
      <line x1="160" y1="103" x2="176" y2="105" stroke={c.teal} strokeWidth="3" strokeLinecap="round" />
      <line x1="159" y1="111" x2="175" y2="113" stroke={c.sage} strokeWidth="3" strokeLinecap="round" />
      <line x1="158" y1="119" x2="170" y2="121" stroke={c.sage} strokeWidth="3" strokeLinecap="round" />
      {/* patient (right), reaching for it */}
      <path d="M232 136 L244 178 L252 206" stroke={c.pine} strokeWidth="11" {...limb} />
      <path d="M224 136 L214 178 L208 208" stroke={c.pine} strokeWidth="11" {...limb} />
      <rect x="204" y="66" width="48" height="78" rx="23" fill={c.teal} />
      <path d="M208 90 L180 108" stroke={c.teal} strokeWidth="10" {...limb} />
      <path d="M244 90 L262 126" stroke={c.teal} strokeWidth="10" {...limb} />
      <circle cx="226" cy="44" r="17" fill="#eeb98f" />
      <path d="M243 40 a17 17 0 0 0 -34 -2 l4 -12 h26 Z" fill={c.pine} />
      {/* a small heart drifting up from the exchange */}
      <path
        d="M170 66 c -3 -6 -12 -5 -12 2 c 0 5 7 9 12 12 c 5 -3 12 -7 12 -12 c 0 -7 -9 -8 -12 -2 Z"
        fill={c.coral}
        opacity="0.9"
      />
    </svg>
  )
}

/** Small sprout-in-pot spot illustration for empty states. */
export function SproutSpot({ className = '' }: { className?: string }) {
  const c = palettes.self
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
