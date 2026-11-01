import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * Après la séquence logo/textes : l'axe descend du haut du cercle au milieu.
 */
export function animateAxisToCenter(
  tl: GsapTimeline,
  axis: HTMLElement,
  at: number,
): number {
  const duration = 1.35;
  tl.to(axis, { opacity: 1, y: 0, duration, ease: "power2.inOut" }, at);
  return at + duration;
}
