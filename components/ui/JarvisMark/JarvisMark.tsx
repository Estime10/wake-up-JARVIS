import { useId } from "react";

import { ThinkHourglass } from "@/components/ui/JarvisMark/ThinkHourglass";
import {
  OUTER_ARC_A_D,
  OUTER_ARC_B_D,
  TICKS_PATH_D,
  TRAIL_HEAD,
  TRAIL_MAIN_D,
} from "@/components/ui/JarvisMark/markPathsV2";
import {
  BOOT_GRADUATIONS_D,
  CROSSHAIR_AND_RETICLES_D,
} from "@/components/ui/JarvisMark/splashChromePaths";
import { TRAIL_ARCS_V2 } from "@/components/ui/JarvisMark/trailArcsV2";
import {
  ERROR_EXCLAMATION_D,
  ERROR_TRIANGLE_D,
  LISTEN_SPOKES,
  OFFLINE_RING_DASH,
  RING_CX,
  RING_CY,
  SPEAK_BARS,
  STATUS_RING_RADIUS,
  THINK_SEGMENTS,
} from "@/components/ui/JarvisMark/voiceRingGeometry";

const TRAIL_FADE_ARCS = TRAIL_ARCS_V2.filter((arc) => arc.d !== TRAIL_MAIN_D);

/**
 * Logo / anneau JARVIS — mark v2 = état final splash (viewBox 248).
 * Chrome boot/réticules inclus (même dessin que splash `#layer-rig`).
 * Modes `data-jarvis="mode-*"` pilotés par GSAP.
 */

type JarvisMarkProps = {
  /** Nom accessible. Absent = logo décoratif, masqué aux lecteurs d'écran. */
  title?: string;
  className?: string;
};

export function JarvisMark({ title, className }: JarvisMarkProps) {
  const uid = useId();
  const brightId = `${uid}-bright`;
  const haloId = `${uid}-halo`;
  const coreId = `${uid}-core`;
  const titleId = `${uid}-title`;
  const informative = typeof title === "string" && title.length > 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 248 248"
      fill="none"
      overflow="visible"
      className={className}
      focusable="false"
      {...(informative
        ? { role: "img", "aria-labelledby": titleId }
        : { "aria-hidden": true })}
    >
      {informative ? <title id={titleId}>{title}</title> : null}
      <defs>
        <radialGradient id={brightId}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.07" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId}>
          <stop offset="0" stopColor="#FFF" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Chrome splash — boot-r150 / boot-r160 dérivent en idle (comme le splash). */}
      <g data-jarvis="splash-chrome">
        <circle
          data-jarvis="boot-r138"
          cx={RING_CX}
          cy={RING_CY}
          r="138"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.21"
          strokeDasharray="200 16.77"
        />
        <circle
          data-jarvis="boot-r150"
          cx={RING_CX}
          cy={RING_CY}
          r="150"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1.25"
          strokeDasharray="36 52 18 96 48 140"
        />
        <path
          data-jarvis="boot-r160"
          d={BOOT_GRADUATIONS_D}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.33"
          strokeWidth="0.8"
        />
        <path
          d={CROSSHAIR_AND_RETICLES_D}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
        />
      </g>

      {/* ring-outer */}
      <circle
        data-jarvis="ring-outer"
        cx={RING_CX}
        cy={RING_CY}
        r="120"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.21"
      />
      <path
        data-jarvis="ring-accent"
        d={OUTER_ARC_A_D}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.33"
        strokeWidth="1.25"
      />
      <path
        data-jarvis="ring-accent-inner"
        d={OUTER_ARC_B_D}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.33"
        strokeWidth="1.25"
      />

      {/* ticks */}
      <path
        data-jarvis="ticks"
        d={TICKS_PATH_D}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.33"
      />

      {/* ring-inner — dial = anneau pointillé (spin idle) */}
      <circle
        cx={RING_CX}
        cy={RING_CY}
        r="88"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="6"
      />
      <circle cx={RING_CX} cy={RING_CY} r="78" fill={`url(#${brightId})`} />
      <circle
        cx={RING_CX}
        cy={RING_CY}
        r="80"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="2"
      />
      <circle
        data-jarvis="ring-dial"
        cx={RING_CX}
        cy={RING_CY}
        r="70"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.33"
        strokeDasharray="2 5"
      />
      <circle
        cx={RING_CX}
        cy={RING_CY}
        r="60"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.21"
      />

      {/* Idle — traînée arcs imbriqués + noyau */}
      <g data-jarvis="mode-idle">
        <g data-jarvis="trail-group">
          <g fill="none" stroke="currentColor" strokeWidth="2">
            {TRAIL_FADE_ARCS.map((arc) => (
              <path key={arc.d} d={arc.d} strokeOpacity={arc.opacity} />
            ))}
          </g>
          {/* Arc principal — idle + intro strokeDashoffset */}
          <path
            data-jarvis="trail"
            d={TRAIL_MAIN_D}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
          <g data-jarvis="head">
            <circle
              cx={TRAIL_HEAD.x}
              cy={TRAIL_HEAD.y}
              r="9"
              fill={`url(#${haloId})`}
            />
            <circle
              cx={TRAIL_HEAD.x}
              cy={TRAIL_HEAD.y}
              r="3"
              fill="currentColor"
              fillOpacity="0.95"
            />
          </g>
        </g>
        <g data-jarvis="core">
          <circle cx={RING_CX} cy={RING_CY} r="22" fill={`url(#${haloId})`} />
          <circle cx={RING_CX} cy={RING_CY} r="6" fill={`url(#${coreId})`} />
        </g>
      </g>

      {/* Écoute */}
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
                rx="0.75"
                fill="currentColor"
                fillOpacity="0.85"
              />
            </g>
          ))}
        </g>
        <g
          data-jarvis="listen-mic"
          fill="currentColor"
          transform={`translate(${RING_CX} ${RING_CY}) scale(0.27) translate(-256 -256)`}
        >
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

      {/* Réfléchit */}
      <g data-jarvis="mode-thinking" opacity="0">
        <g
          data-jarvis="think-segments"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
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

      {/* Parole */}
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
              rx="1"
              fill="currentColor"
            />
          ))}
        </g>
      </g>

      {/* Erreur */}
      <g data-jarvis="mode-error" opacity="0" className="text-danger">
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={STATUS_RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
        />
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={ERROR_TRIANGLE_D} />
          <path d={ERROR_EXCLAMATION_D} />
        </g>
      </g>

      {/* Hors ligne */}
      <g data-jarvis="mode-offline" opacity="0" className="text-text-muted">
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={STATUS_RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray={OFFLINE_RING_DASH}
        />
      </g>
    </svg>
  );
}
