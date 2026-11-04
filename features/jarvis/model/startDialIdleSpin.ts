import gsap from "gsap";

import { MARK_SVG_ORIGIN } from "@/components/ui/JarvisMark/voiceRingGeometry";
import { DIAL_IDLE_SPIN_SECONDS } from "@/lib/intro/timings";

/**
 * Cadran pointillé : rotation continue antihoraire.
 * Tue les tweens existants — un seul propriétaire du spin.
 */
export function startDialIdleSpin(ringDial: SVGGeometryElement): void {
  gsap.killTweensOf(ringDial);
  gsap.set(ringDial, {
    svgOrigin: MARK_SVG_ORIGIN,
    transformOrigin: "50% 50%",
  });
  gsap.to(ringDial, {
    rotation: "-=360",
    duration: DIAL_IDLE_SPIN_SECONDS,
    ease: "none",
    repeat: -1,
  });
}
