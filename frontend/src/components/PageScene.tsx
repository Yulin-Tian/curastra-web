import { useLocation } from 'react-router-dom'

/** Quiet Nordic scenery anchored to the bottom of app pages, painted with the
 * pine/sage theme tokens so it recolors per family profile. Each page group
 * has its own mood: pines for the document pages, a ridgeline with a pulse
 * for vitals, a night sky for the assistant, a cradled heart for emergency,
 * and a cabin for profile. The dashboard brings its own illustration, so no
 * scene there. Sits behind all content and never intercepts clicks. */

const MEADOW = 'M0,240 L0,206 C300,176 600,216 900,196 C1100,182 1300,206 1440,192 L1440,240 Z'
const LINE = { strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

function Pine({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0,0 L0,-38" />
      <path d="M-11,-8 L0,-24 L11,-8" />
      <path d="M-9,-18 L0,-32 L9,-18" />
      <path d="M-6,-27 L0,-38 L6,-27" />
    </g>
  )
}

function Birds() {
  return (
    <g className="stroke-pine-900" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M688,72 q9,-9 18,0 q9,-9 18,0" />
      <path d="M762,50 q6,-6 12,0 q6,-6 12,0" />
    </g>
  )
}

/* Records / Care Plans / Medications — the original forest. */
function ForestScene() {
  return (
    <>
      <path
        d="M0,190 C240,118 480,152 720,140 C960,128 1200,172 1440,148 L1440,240 L0,240 Z"
        className="fill-sage-200"
        fillOpacity="0.45"
      />
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      <g className="stroke-pine-900" strokeOpacity="0.15" {...LINE}>
        <Pine x={150} y={198} s={1} />
        <Pine x={197} y={203} s={0.65} />
        <Pine x={622} y={190} s={0.9} />
        <Pine x={1046} y={198} s={1.1} />
        <Pine x={1106} y={203} s={0.6} />
        <Pine x={1322} y={194} s={0.8} />
      </g>
      <Birds />
      <g className="scene-sun">
        <circle cx="1232" cy="64" r="30" className="fill-sage-200" fillOpacity="0.5" />
        <circle cx="1232" cy="64" r="30" className="stroke-pine-900" strokeOpacity="0.12" strokeWidth="2" fill="none" />
      </g>
      <g className="scene-kite stroke-pine-900" strokeOpacity="0.28" {...LINE}>
        <path d="M1232,36 L1250,62 L1232,88 L1214,62 Z" className="fill-sage-200" fillOpacity="0.55" />
        <path d="M1232,36 L1232,88 M1214,62 L1250,62" />
        <path d="M1232,88 q-10,18 4,28 q12,9 2,24" strokeOpacity="0.2" />
      </g>
    </>
  )
}

/* Vitals — a mountain ridgeline that reads like a trend, plus a pulse line. */
function VitalsScene() {
  return (
    <>
      <path
        d="M0,200 L130,148 L250,186 L400,124 L540,180 L700,140 L860,184 L1020,132 L1180,178 L1320,150 L1440,170 L1440,240 L0,240 Z"
        className="fill-sage-200"
        fillOpacity="0.45"
      />
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      {/* the pulse travelling across the ridge */}
      <path
        d="M330,110 h80 l16,-30 16,52 16,-34 h80"
        className="stroke-pine-900"
        strokeOpacity="0.22"
        {...LINE}
      />
      <circle cx="546" cy="110" r="4" className="fill-pine-900" fillOpacity="0.22" />
      <Birds />
      <g className="stroke-pine-900" strokeOpacity="0.15" {...LINE}>
        <Pine x={1250} y={196} s={0.85} />
        <Pine x={1300} y={200} s={0.6} />
      </g>
      <circle cx="1160" cy="58" r="26" className="fill-sage-200" fillOpacity="0.5" />
      <circle cx="1160" cy="58" r="26" className="stroke-pine-900" strokeOpacity="0.12" strokeWidth="2" fill="none" />
    </>
  )
}

/* Assistant — a still night: moon, stars, and a ribbon of northern lights. */
function NightScene() {
  return (
    <>
      <path
        d="M0,96 C240,56 480,110 720,84 C960,58 1200,108 1440,76 L1440,140 C1200,168 960,120 720,146 C480,172 240,120 0,152 Z"
        className="fill-pine-100"
        fillOpacity="0.5"
      />
      <path
        d="M0,190 C240,118 480,152 720,140 C960,128 1200,172 1440,148 L1440,240 L0,240 Z"
        className="fill-sage-200"
        fillOpacity="0.45"
      />
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      {/* crescent moon */}
      <path
        d="M1216,38 a30,30 0 1,0 26,44 a24,24 0 1,1 -26,-44 Z"
        className="fill-pine-900"
        fillOpacity="0.14"
      />
      {/* star sparkles */}
      <g className="stroke-pine-900" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M180,52 v14 M173,59 h14" />
        <path d="M420,32 v10 M415,37 h10" />
        <path d="M900,44 v12 M894,50 h12" />
        <path d="M1080,26 v10 M1075,31 h10" />
        <path d="M640,64 v8 M636,68 h8" />
      </g>
      <g className="stroke-pine-900" strokeOpacity="0.15" {...LINE}>
        <Pine x={170} y={198} s={0.9} />
        <Pine x={1280} y={196} s={0.8} />
      </g>
    </>
  )
}

/* Emergency — hills like cupped hands, cradling a heart. Caring, warm. */
function CaringScene() {
  return (
    <>
      <path
        d="M0,206 C260,150 480,196 720,176 C960,156 1200,200 1440,172 L1440,240 L0,240 Z"
        className="fill-sage-200"
        fillOpacity="0.45"
      />
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      {/* the cradled heart */}
      <g transform="translate(720,108)">
        <path
          d="M0,26 C-6,12 -30,4 -30,-12 C-30,-26 -16,-32 0,-16 C16,-32 30,-26 30,-12 C30,4 6,12 0,26 Z"
          className="fill-red-200"
          fillOpacity="0.45"
        />
        <path
          d="M0,26 C-6,12 -30,4 -30,-12 C-30,-26 -16,-32 0,-16 C16,-32 30,-26 30,-12 C30,4 6,12 0,26 Z"
          className="stroke-red-400"
          strokeOpacity="0.4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* gentle care arcs, like a hug around the heart */}
        <g className="stroke-red-300" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M-48,10 a52,52 0 0,1 18,-44" />
          <path d="M48,10 a52,52 0 0,0 -18,-44" />
        </g>
      </g>
      {/* two small companion hearts */}
      <g className="fill-red-200" fillOpacity="0.45">
        <path d="M320,150 c-2,-5 -10,-7 -10,-13 c0,-5 6,-7 10,-2 c4,-5 10,-3 10,2 c0,6 -8,8 -10,13 Z" />
        <path d="M1130,140 c-1.6,-4 -8,-5.6 -8,-10.4 c0,-4 4.8,-5.6 8,-1.6 c3.2,-4 8,-2.4 8,1.6 c0,4.8 -6.4,6.4 -8,10.4 Z" />
      </g>
      <Birds />
    </>
  )
}

/* Profile — home: a cabin with chimney smoke, fence, and a path. */
function HomeScene() {
  return (
    <>
      <path
        d="M0,196 C300,140 620,180 900,160 C1140,146 1300,188 1440,164 L1440,240 L0,240 Z"
        className="fill-sage-200"
        fillOpacity="0.45"
      />
      <path d={MEADOW} className="fill-sage-100" fillOpacity="0.9" />
      <g className="stroke-pine-900" strokeOpacity="0.18" {...LINE}>
        {/* cabin */}
        <g transform="translate(700,190)">
          <path d="M-42,0 L-42,-40 L42,-40 L42,0" />
          <path d="M-52,-38 L0,-72 L52,-38" className="fill-sage-200" fillOpacity="0.5" />
          {/* chimney + smoke */}
          <path d="M22,-52 L22,-66 L32,-66 L32,-58" />
          <path d="M27,-74 q-6,-8 2,-14 q8,-6 2,-14" strokeOpacity="0.8" />
          {/* door and window */}
          <path d="M-10,0 L-10,-24 L10,-24 L10,0" />
          <circle cx="-26" cy="-22" r="7" />
          {/* path to the door */}
          <path d="M0,2 q-14,14 -44,20" strokeOpacity="0.6" />
        </g>
        {/* fence */}
        <path d="M560,196 v-14 M580,197 v-14 M600,198 v-14 M560,189 h40" strokeOpacity="0.7" />
        <path d="M810,196 v-14 M830,195 v-14 M850,194 v-14 M810,189 h40" strokeOpacity="0.7" />
        <Pine x={520} y={200} s={0.8} />
        <Pine x={905} y={198} s={0.95} />
      </g>
      <Birds />
      <circle cx="1200" cy="60" r="28" className="fill-sage-200" fillOpacity="0.5" />
      <circle cx="1200" cy="60" r="28" className="stroke-pine-900" strokeOpacity="0.12" strokeWidth="2" fill="none" />
    </>
  )
}

export function PageScene() {
  const { pathname } = useLocation()

  let scene: React.ReactNode = null
  if (
    pathname.startsWith('/records') ||
    pathname.startsWith('/care-plans') ||
    pathname.startsWith('/medications')
  ) {
    scene = <ForestScene />
  } else if (pathname.startsWith('/vitals')) {
    scene = <VitalsScene />
  } else if (pathname.startsWith('/assistant')) {
    scene = <NightScene />
  } else if (pathname.startsWith('/emergency')) {
    scene = <CaringScene />
  } else if (pathname.startsWith('/profile')) {
    scene = <HomeScene />
  }
  if (scene === null) return null // dashboard has its own illustration

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 hidden select-none print:hidden sm:block"
    >
      <svg
        viewBox="0 0 1440 240"
        preserveAspectRatio="xMidYMax slice"
        className="h-36 w-full md:h-44"
      >
        {scene}
      </svg>
    </div>
  )
}
