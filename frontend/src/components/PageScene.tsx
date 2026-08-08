/** A quiet Nordic landscape anchored to the bottom of every app page —
 * rolling hills, a few line-art pines, birds, and a low sun (a kite on the
 * child theme). Painted entirely with the pine/sage theme tokens, so it
 * recolors itself for each family profile. Sits behind all content
 * (negative z-index), never intercepts clicks, and stays off print. */
export function PageScene() {
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
        {/* back hills */}
        <path
          d="M0,190 C240,118 480,152 720,140 C960,128 1200,172 1440,148 L1440,240 L0,240 Z"
          className="fill-sage-200"
          fillOpacity="0.45"
        />
        {/* front meadow */}
        <path
          d="M0,240 L0,206 C300,176 600,216 900,196 C1100,182 1300,206 1440,192 L1440,240 Z"
          className="fill-sage-100"
          fillOpacity="0.9"
        />

        {/* pines: trunk + stacked chevrons, hand-drawn line art */}
        <g className="stroke-pine-900" strokeOpacity="0.15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {[
            { x: 150, y: 198, s: 1 },
            { x: 197, y: 203, s: 0.65 },
            { x: 622, y: 190, s: 0.9 },
            { x: 1046, y: 198, s: 1.1 },
            { x: 1106, y: 203, s: 0.6 },
            { x: 1322, y: 194, s: 0.8 },
          ].map(({ x, y, s }, i) => (
            <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
              <path d="M0,0 L0,-38" />
              <path d="M-11,-8 L0,-24 L11,-8" />
              <path d="M-9,-18 L0,-32 L9,-18" />
              <path d="M-6,-27 L0,-38 L6,-27" />
            </g>
          ))}
        </g>

        {/* birds */}
        <g className="stroke-pine-900" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M688,72 q9,-9 18,0 q9,-9 18,0" />
          <path d="M762,50 q6,-6 12,0 q6,-6 12,0" />
        </g>

        {/* low sun — default and parent themes */}
        <g className="scene-sun">
          <circle cx="1232" cy="64" r="30" className="fill-sage-200" fillOpacity="0.5" />
          <circle cx="1232" cy="64" r="30" className="stroke-pine-900" strokeOpacity="0.12" strokeWidth="2" fill="none" />
        </g>

        {/* kite — child theme */}
        <g className="scene-kite stroke-pine-900" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M1232,36 L1250,62 L1232,88 L1214,62 Z" className="fill-sage-200" fillOpacity="0.55" />
          <path d="M1232,36 L1232,88 M1214,62 L1250,62" />
          <path d="M1232,88 q-10,18 4,28 q12,9 2,24" strokeOpacity="0.2" />
        </g>
      </svg>
    </div>
  )
}
