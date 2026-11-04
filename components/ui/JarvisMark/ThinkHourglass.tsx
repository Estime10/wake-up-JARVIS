import { RING_CX, RING_CY } from "@/components/ui/JarvisMark/voiceRingGeometry";

/**
 * Sablier centre — anneau « réfléchit ».
 * Dessin natif 512, scale vers mark v2 (centre 124).
 */
export function ThinkHourglass() {
  return (
    <g
      data-jarvis="think-hourglass"
      transform={`translate(${RING_CX} ${RING_CY}) scale(0.27) translate(-256 -256)`}
    >
      <g fill="currentColor">
        <rect x="200" y="168" width="112" height="18" rx="5" />
        <rect x="200" y="326" width="112" height="18" rx="5" />
        <rect x="206" y="180" width="12" height="152" rx="3" />
        <rect x="294" y="180" width="12" height="152" rx="3" />
        <path d="M242 192H270C276 192 280 198 280 206C280 222 270 236 260 248L256 254L252 248C242 236 232 222 232 206C232 198 236 192 242 192Z" />
        <path d="M256 258L260 264C270 276 280 290 280 306C280 314 276 320 270 320H242C236 320 232 314 232 306C232 290 242 276 252 264L256 258Z" />
      </g>
      <path
        fill="currentColor"
        fillOpacity="0.4"
        d="M244 298C248 286 252 280 256 280C260 280 264 286 268 298C270 304 270 312 270 312H242C242 312 242 304 244 298Z"
      />
      <rect
        x="250"
        y="250"
        width="12"
        height="12"
        rx="2.5"
        fill="currentColor"
      />
    </g>
  );
}
