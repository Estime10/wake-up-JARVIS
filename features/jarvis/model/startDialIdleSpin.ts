import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { DIAL_IDLE_SPIN_SECONDS } from "@/lib/intro/timings";

/**
 * Cadran pointillé : rotation continue antihoraire.
 * Tue les tweens existants — un seul propriétaire du spin (pas de double).
 * Pas de `rotation: 0` (évite le saut si le splash tournait déjà).
 */
export function startDialIdleSpin(ringDial: SVGGeometryElement): void {
  gsap.killTweensOf(ringDial);
  gsap.set(ringDial, {
    svgOrigin: "256 256",
    transformOrigin: "50% 50%",
  });
  gsap.to(ringDial, {
    rotation: "-=360",
    duration: DIAL_IDLE_SPIN_SECONDS,
    ease: "none",
    repeat: -1,
  });
}

/**
 * Déclenche le spin idle à la fin de la timeline intro.
 * Le callback s'exécute dans le contexte GSAP de la timeline (voir
 * `scheduleWakeBarsIdlePulse`) → revert garanti au démontage.
 */
export function scheduleDialIdleSpin(
  tl: GsapTimeline,
  ringDial: SVGGeometryElement,
): void {
  tl.call(() => {
    startDialIdleSpin(ringDial);
  });
}
