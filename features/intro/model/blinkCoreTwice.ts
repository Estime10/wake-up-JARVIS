import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * Noyau au centre : s'affiche, clignote 2 fois, reste allumé.
 * Uniquement opacity — aucun déplacement. Rythme volontairement lent.
 */
export function blinkCoreTwice(
  tl: GsapTimeline,
  core: SVGGElement,
  at: number,
): number {
  const flash = 0.32;
  const gap = 0.22;

  let t = at;
  tl.to(core, { opacity: 1, duration: flash, ease: "none" }, t);
  t += flash;
  tl.to(core, { opacity: 0.12, duration: flash, ease: "none" }, t);
  t += flash + gap;
  tl.to(core, { opacity: 1, duration: flash, ease: "none" }, t);
  t += flash;
  tl.to(core, { opacity: 0.12, duration: flash, ease: "none" }, t);
  t += flash + gap;
  tl.to(core, { opacity: 1, duration: flash * 1.35, ease: "power1.out" }, t);
  t += flash * 1.35;

  return t;
}
