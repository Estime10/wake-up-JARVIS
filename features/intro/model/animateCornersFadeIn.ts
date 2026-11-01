import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";

type HudFinaleTargets = {
  hudCorners: HTMLElement;
  hudBrackets: HTMLElement;
};

/** Finale HUD : textes + équerres en fade commun (sans clignotement). */
export function animateCornersFadeIn(
  tl: GsapTimeline,
  targets: HudFinaleTargets,
  at: number,
  fade = 0.55,
): number {
  const { hudCorners, hudBrackets } = targets;

  tl.to(
    [hudCorners, hudBrackets],
    { opacity: 1, duration: fade, ease: "power2.out" },
    at,
  );

  return at + fade;
}

export function prepareCornersHidden(targets: HudFinaleTargets): void {
  gsap.set(targets.hudCorners, { opacity: 0 });
  gsap.set(targets.hudBrackets, { opacity: 0 });
}
