import { useLocation } from 'react-router-dom'

/** Quiet Nordic scenery for the app pages, painted with the pine/sage theme
 * tokens so it recolors per family profile. The hero motifs live in the two
 * side gutters flanking the content column (always visible, never covered by
 * cards — they only render on screens wide enough to have gutters), and a
 * soft meadow strip grounds the page bottom. Each page group has its own
 * mood; the dashboard brings its own illustration, so no scene there. */

type Variant = 'forest' | 'vitals' | 'night' | 'caring' | 'home'

const MEADOW = 'M0,240 L0,206 C300,176 600,216 900,196 C1100,182 1300,206 1440,192 L1440,240 Z'
const LINE = { strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

/* ---------- shared glyphs (side gutters) ---------- */

function PineGlyph({ s = 1 }: { s?: number }) {
  return (
    <svg width={64 * s} height={72 * s} viewBox="0 0 64 72" className="stroke-pine-900" strokeOpacity="0.25" {...LINE}>
      <path d="M32,68 L32,14" />
      <path d="M14,54 L32,28 L50,54" />
      <path d="M17,38 L32,16 L47,38" />
      <path d="M21,24 L32,8 L43,24" />
    </svg>
  )
}

function BirdsGlyph() {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" className="stroke-pine-900" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M6,18 q7,-7 14,0 q7,-7 14,0" />
      <path d="M46,8 q5,-5 10,0 q5,-5 10,0" />
    </svg>
  )
}

function SunGlyph() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="24" className="fill-sage-200" fillOpacity="0.8" />
      <circle cx="36" cy="36" r="24" className="stroke-pine-900" strokeOpacity="0.18" strokeWidth="2" fill="none" />
    </svg>
  )
}

function KiteGlyph() {
  return (
    <svg width="72" height="96" viewBox="0 0 72 96" className="stroke-pine-900" strokeOpacity="0.35" {...LINE}>
      <path d="M36,6 L54,32 L36,58 L18,32 Z" className="fill-sage-200" fillOpacity="0.8" />
      <path d="M36,6 L36,58 M18,32 L54,32" />
      <path d="M36,58 q-10,16 4,24 q12,8 2,20" strokeOpacity="0.25" />
    </svg>
  )
}

/* ---------- per-variant glyphs ---------- */

function MoonGlyph() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <path d="M30,10 a26,26 0 1,0 24,38 a21,21 0 1,1 -24,-38 Z" className="fill-pine-900" fillOpacity="0.2" />
    </svg>
  )
}

function StarsGlyph() {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" className="stroke-pine-900" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M16,14 v12 M10,20 h12" />
      <path d="M52,36 v10 M47,41 h10" />
      <path d="M28,62 v14 M21,69 h14" />
    </svg>
  )
}

function AuroraGlyph() {
  return (
    <svg width="88" height="96" viewBox="0 0 88 96">
      <path d="M14,88 C4,64 24,52 16,30 C12,18 20,8 28,4" className="stroke-pine-100" strokeOpacity="0.9" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M52,92 C42,70 62,56 54,36 C50,24 58,14 66,10" className="fill-none stroke-sage-200" strokeOpacity="0.9" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}

function PulseGlyph() {
  return (
    <svg width="96" height="48" viewBox="0 0 96 48" className="stroke-pine-900" strokeOpacity="0.3" {...LINE}>
      <path d="M4,26 h22 l8,-16 10,28 8,-18 h22" />
      <circle cx="88" cy="26" r="3.5" className="fill-pine-900" fillOpacity="0.3" stroke="none" />
    </svg>
  )
}

function RidgeGlyph() {
  return (
    <svg width="96" height="64" viewBox="0 0 96 64">
      <path d="M2,60 L26,22 L42,44 L62,10 L94,60 Z" className="fill-sage-200" fillOpacity="0.8" />
      <path d="M2,60 L26,22 L42,44 L62,10 L94,60" className="stroke-pine-900" strokeOpacity="0.2" {...LINE} />
    </svg>
  )
}

function HeartGlyph({ s = 1 }: { s?: number }) {
  return (
    <svg width={96 * s} height={92 * s} viewBox="0 0 96 92">
      <path
        d="M48,74 C40,56 14,48 14,28 C14,10 32,4 48,24 C64,4 82,10 82,28 C82,48 56,56 48,74 Z"
        className="fill-red-200"
        fillOpacity="0.55"
      />
      <path
        d="M48,74 C40,56 14,48 14,28 C14,10 32,4 48,24 C64,4 82,10 82,28 C82,48 56,56 48,74 Z"
        className="stroke-red-400"
        strokeOpacity="0.45"
        {...LINE}
      />
      <path d="M2,54 a58,58 0 0,1 16,-44 M94,54 a58,58 0 0,0 -16,-44" className="stroke-red-300" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function SmallHeartsGlyph() {
  return (
    <svg width="72" height="80" viewBox="0 0 72 80" className="fill-red-200" fillOpacity="0.6">
      <path d="M20,34 c-3,-8 -14,-11 -14,-20 c0,-8 9,-10 14,-3 c5,-7 14,-5 14,3 c0,9 -11,12 -14,20 Z" />
      <path d="M50,72 c-2,-6 -10,-8 -10,-15 c0,-6 7,-8 10,-2 c3,-6 10,-4 10,2 c0,7 -8,9 -10,15 Z" />
    </svg>
  )
}

function CabinGlyph() {
  return (
    <svg width="96" height="103" viewBox="0 0 112 120" className="stroke-pine-900" strokeOpacity="0.3" {...LINE}>
      <path d="M20,112 L20,66 L92,66 L92,112" />
      <path d="M12,68 L56,36 L100,68" className="fill-sage-200" fillOpacity="0.8" />
      <path d="M74,52 L74,38 L84,38 L84,45" />
      <path d="M79,30 q-6,-8 2,-14 q8,-6 2,-14" strokeOpacity="0.24" />
      <path d="M46,112 L46,86 L66,86 L66,112" />
      <circle cx="32" cy="84" r="7" />
      <path d="M20,112 L92,112" />
    </svg>
  )
}

function FenceGlyph() {
  return (
    <svg width="88" height="48" viewBox="0 0 88 48" className="stroke-pine-900" strokeOpacity="0.28" {...LINE}>
      <path d="M12,44 V16 M32,44 V14 M52,44 V16 M72,44 V14" />
      <path d="M4,26 H82" />
    </svg>
  )
}

/* ---------- side gutters ---------- */

const GUTTER: Record<Variant, { left: React.ReactNode; right: React.ReactNode }> = {
  forest: {
    left: (
      <>
        <BirdsGlyph />
        <PineGlyph s={0.8} />
        <PineGlyph s={1.1} />
      </>
    ),
    right: (
      <>
        <span className="scene-sun"><SunGlyph /></span>
        <span className="scene-kite"><KiteGlyph /></span>
        <BirdsGlyph />
        <PineGlyph />
      </>
    ),
  },
  vitals: {
    left: (
      <>
        <BirdsGlyph />
        <PulseGlyph />
        <RidgeGlyph />
      </>
    ),
    right: (
      <>
        <SunGlyph />
        <RidgeGlyph />
        <PineGlyph s={0.85} />
      </>
    ),
  },
  night: {
    left: (
      <>
        <StarsGlyph />
        <AuroraGlyph />
        <PineGlyph s={0.85} />
      </>
    ),
    right: (
      <>
        <MoonGlyph />
        <StarsGlyph />
        <PineGlyph s={0.9} />
      </>
    ),
  },
  caring: {
    left: (
      <>
        <BirdsGlyph />
        <SmallHeartsGlyph />
      </>
    ),
    right: (
      <>
        <HeartGlyph />
        <SmallHeartsGlyph />
      </>
    ),
  },
  home: {
    left: (
      <>
        <BirdsGlyph />
        <PineGlyph s={0.9} />
        <FenceGlyph />
      </>
    ),
    right: (
      <>
        <SunGlyph />
        <CabinGlyph />
        <FenceGlyph />
      </>
    ),
  },
}

/* ---------- bottom strips (soft ground; motifs live in the gutters) ---------- */

function BottomStrip({ variant }: { variant: Variant }) {
  return (
    <svg viewBox="0 0 1440 240" preserveAspectRatio="xMidYMax slice" className="h-32 w-full md:h-40">
      {variant === 'vitals' ? (
        <path
          d="M0,200 L130,148 L250,186 L400,124 L540,180 L700,140 L860,184 L1020,132 L1180,178 L1320,150 L1440,170 L1440,240 L0,240 Z"
          className="fill-sage-200"
          fillOpacity="0.45"
        />
      ) : (
        <path
          d="M0,190 C240,118 480,152 720,140 C960,128 1200,172 1440,148 L1440,240 L0,240 Z"
          className="fill-sage-200"
          fillOpacity="0.45"
        />
      )}
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      {variant === 'caring' && (
        <g className="fill-red-200" fillOpacity="0.5">
          <path d="M320,196 c-2,-5 -10,-7 -10,-13 c0,-5 6,-7 10,-2 c4,-5 10,-3 10,2 c0,6 -8,8 -10,13 Z" />
          <path d="M1130,190 c-1.6,-4 -8,-5.6 -8,-10.4 c0,-4 4.8,-5.6 8,-1.6 c3.2,-4 8,-2.4 8,1.6 c0,4.8 -6.4,6.4 -8,10.4 Z" />
        </g>
      )}
      {(variant === 'forest' || variant === 'night' || variant === 'home') && (
        <g className="stroke-pine-900" strokeOpacity="0.14" {...LINE}>
          <g transform="translate(200,200) scale(0.7)">
            <path d="M0,0 L0,-38 M-11,-8 L0,-24 L11,-8 M-9,-18 L0,-32 L9,-18 M-6,-27 L0,-38 L6,-27" />
          </g>
          <g transform="translate(1240,198) scale(0.85)">
            <path d="M0,0 L0,-38 M-11,-8 L0,-24 L11,-8 M-9,-18 L0,-32 L9,-18 M-6,-27 L0,-38 L6,-27" />
          </g>
        </g>
      )}
    </svg>
  )
}

/* ---------- the scene ---------- */

export function PageScene() {
  const { pathname } = useLocation()

  let variant: Variant | null = null
  if (
    pathname.startsWith('/records') ||
    pathname.startsWith('/care-plans') ||
    pathname.startsWith('/medications')
  ) {
    variant = 'forest'
  } else if (pathname.startsWith('/vitals')) {
    variant = 'vitals'
  } else if (pathname.startsWith('/assistant')) {
    variant = 'night'
  } else if (pathname.startsWith('/emergency')) {
    variant = 'caring'
  } else if (pathname.startsWith('/profile')) {
    variant = 'home'
  }
  if (variant === null) return null // dashboard has its own illustration

  const gutter = GUTTER[variant]
  return (
    <div aria-hidden="true" className="pointer-events-none select-none print:hidden">
      {/* side gutters: only on screens wide enough to have them */}
      <div className="fixed bottom-40 left-[17rem] top-28 -z-10 hidden w-24 flex-col items-center justify-between 2xl:flex">
        {gutter.left}
      </div>
      <div className="fixed bottom-40 right-4 top-28 -z-10 hidden w-24 flex-col items-center justify-between 2xl:flex">
        {gutter.right}
      </div>
      {/* ground strip */}
      <div className="fixed inset-x-0 bottom-0 -z-10 hidden sm:block">
        <BottomStrip variant={variant} />
      </div>
    </div>
  )
}
