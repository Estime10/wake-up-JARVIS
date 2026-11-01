import { useId } from "react";

import { TRAIL_FADE_SEGMENTS } from "@/components/ui/JarvisMark/trailFadeSegments";

/**
 * Logo JARVIS (DA v3-blanc), repris de public/assets/jarvis-mark.svg
 * (chemin exporté via `@/lib/assets`).
 * Nœuds `data-jarvis` exposés pour GSAP (intro) : ring-outer, ring-dial, trail, head, core.
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
      {/* Arcs externes segmentés (maquette) — décor, hors flip. */}
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
    </svg>
  );
}
