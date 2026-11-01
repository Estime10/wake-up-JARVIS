import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { DIAL_IDLE_SPIN_SECONDS } from "@/lib/intro/timings";

/**
 * Cadran pointillé : rotation continue antihoraire (lente), hors timeline
 * pour ne pas bloquer `onComplete` (repeat: -1).
 */
export function startDialIdleSpin(ringDial: SVGGeometryElement): void {
  gsap.set(ringDial, {
    svgOrigin: "256 256",
    transformOrigin: "50% 50%",
    rotation: 0,
  });
  gsap.to(ringDial, {
    rotation: -360,
    duration: DIAL_IDLE_SPIN_SECONDS,
    ease: "none",
    repeat: -1,
  });
}

/** Déclenche le spin idle à la fin de la timeline (après axe / pad). */
export function scheduleDialIdleSpin(
  tl: GsapTimeline,
  ringDial: SVGGeometryElement,
): void {
  tl.call(() => {
    startDialIdleSpin(ringDial);
  });
}
