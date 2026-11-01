import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";

type HudFinaleTargets = {
  hudCorners: HTMLElement;
  hudBrackets: HTMLElement;
};

/**
 * Finale HUD : textes des coins en fade,
 * équerres (petites barres) en fade puis clignotements.
 */
export function animateCornersFadeIn(
  tl: GsapTimeline,
  targets: HudFinaleTargets,
  at: number,
): number {
  const { hudCorners, hudBrackets } = targets;
  const fade = 0.85;

  tl.to(hudCorners, { opacity: 1, duration: fade, ease: "power2.out" }, at);
  tl.to(hudBrackets, { opacity: 1, duration: fade, ease: "power2.out" }, at);

  const blinkAt = at + fade;
  const blink = 0.18;
  const gap = 0.1;
  let t = blinkAt;

  tl.to(hudBrackets, { opacity: 0.15, duration: blink, ease: "none" }, t);
  t += blink;
  tl.to(hudBrackets, { opacity: 1, duration: blink, ease: "none" }, t);
  t += blink + gap;
  tl.to(hudBrackets, { opacity: 0.15, duration: blink, ease: "none" }, t);
  t += blink;
  tl.to(
    hudBrackets,
    { opacity: 1, duration: blink * 1.2, ease: "power1.out" },
    t,
  );
  t += blink * 1.2;

  return t;
}

export function prepareCornersHidden(targets: HudFinaleTargets): void {
  gsap.set(targets.hudCorners, { opacity: 0 });
  gsap.set(targets.hudBrackets, { opacity: 0 });
}
