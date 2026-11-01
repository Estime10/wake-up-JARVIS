import { useId } from "react";

import { ThinkHourglass } from "@/components/ui/JarvisMark/ThinkHourglass";
import { TRAIL_FADE_SEGMENTS } from "@/components/ui/JarvisMark/trailFadeSegments";
import {
  ERROR_EXCLAMATION_D,
  ERROR_TRIANGLE_D,
  LISTEN_SPOKES,
  OFFLINE_RING_DASH,
  SPEAK_BARS,
  STATUS_RING_RADIUS,
  THINK_SEGMENTS,
} from "@/components/ui/JarvisMark/voiceRingGeometry";

/**
 * Logo / anneau JARVIS (DA v3-blanc).
 * Modes `data-jarvis="mode-*"` pilotés par GSAP (idle / écoute / réfléchit /
 * parole / erreur / hors ligne).
 */

type JarvisMarkProps = {
  /** Nom accessible. Absent = logo décoratif, masqué aux lecteurs d'écran. */
  title?: string;
  className?: string;
};

export function JarvisMark({ title, className }: JarvisMarkProps) {
  const uid = useId();
  const maskId = `${uid}-trail-fade`;
  const haloId = `${uid}-halo-fill`;
  const coreId = `${uid}-core-fill`;
  const titleId = `${uid}-title`;
  const informative = typeof title === "string" && title.length > 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      focusable="false"
      {...(informative
        ? { role: "img", "aria-labelledby": titleId }
        : { "aria-hidden": true })}
    >
      {informative ? <title id={titleId}>{title}</title> : null}
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="512"
          height="512"
        >
          <g fill="none" strokeWidth="16">
            {TRAIL_FADE_SEGMENTS.map(([d, stroke]) => (
              <path key={d} d={d} stroke={stroke} />
            ))}
          </g>
        </mask>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <circle
        data-jarvis="ring-accent"
        cx="256"
        cy="256"
        r="246"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1.5"
        strokeDasharray="36 52 18 96 48 140"
        transform="rotate(-28 256 256)"
      />
      <circle
        data-jarvis="ring-accent-inner"
        cx="256"
        cy="256"
        r="232"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
        strokeDasharray="22 70 40 110"
        transform="rotate(48 256 256)"
      />
      <circle
        data-jarvis="ring-outer"
        cx="256"
        cy="256"
        r="210"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      <circle
        data-jarvis="ring-dial"
        cx="256"
        cy="256"
        r="140"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeDasharray="2 10"
      />

      {/* Idle — traînée + noyau */}
      <g data-jarvis="mode-idle">
        <g data-jarvis="trail-group">
          <path
            data-jarvis="trail"
            d="M411.9 166.0A180 180 0 1 1 317.6 86.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            mask={`url(#${maskId})`}
          />
          <g data-jarvis="head">
            <circle cx="317.6" cy="86.9" r="30" fill={`url(#${haloId})`} />
            <circle cx="317.6" cy="86.9" r="11" fill="currentColor" />
          </g>
        </g>
        <g data-jarvis="core">
          <circle cx="256" cy="256" r="64" fill={`url(#${haloId})`} />
          <circle cx="256" cy="256" r="26" fill={`url(#${coreId})`} />
        </g>
      </g>

      {/* Écoute — 72 segments + micro SVG */}
      <g data-jarvis="mode-listening" opacity="0">
        <g data-jarvis="listen-spokes">
          {LISTEN_SPOKES.map((spoke) => (
            <g key={spoke.key} transform={spoke.transform}>
              <rect
                data-jarvis="listen-spoke"
                x={spoke.x}
                y={spoke.y}
                width={spoke.width}
                height={spoke.height}
                rx="1.5"
                fill="currentColor"
                fillOpacity="0.85"
              />
            </g>
          ))}
        </g>
        <g
          data-jarvis="listen-mic"
          fill="currentColor"
          transform="translate(256 256) scale(0.55) translate(-256 -256)"
        >
          {/* Capsule micro — silhouette classique, coords natives 512 */}
          <rect x="236" y="198" width="40" height="78" rx="20" />
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M218 254v10c0 21 17 38 38 38s38-17 38-38v-10" />
            <path d="M256 302v26" />
            <path d="M234 328h44" />
          </g>
        </g>
      </g>

      {/* Réfléchit — 16 arcs + sablier SVG */}
      <g data-jarvis="mode-thinking" opacity="0">
        <g
          data-jarvis="think-segments"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        >
          {THINK_SEGMENTS.map((segment) => (
            <path
              key={segment.key}
              d={segment.d}
              strokeOpacity={segment.opacity}
            />
          ))}
        </g>
        <ThinkHourglass />
      </g>

      {/* Parole — barres verticales SVG */}
      <g data-jarvis="mode-speaking" opacity="0">
        <g data-jarvis="speak-bars">
          {SPEAK_BARS.map((bar) => (
            <rect
              key={bar.key}
              data-jarvis="speak-bar"
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="2"
              fill="currentColor"
            />
          ))}
        </g>
      </g>

      {/* Erreur — anneau rouge figé + triangle */}
      <g data-jarvis="mode-error" opacity="0" className="text-danger">
        <circle
          cx="256"
          cy="256"
          r={STATUS_RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
        />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ERROR_TRIANGLE_D} />
          <path d={ERROR_EXCLAMATION_D} />
        </g>
      </g>

      {/* Hors ligne — tirets gris figés */}
      <g data-jarvis="mode-offline" opacity="0" className="text-text-muted">
        <circle
          cx="256"
          cy="256"
          r={STATUS_RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={OFFLINE_RING_DASH}
        />
      </g>
    </svg>
  );
}
