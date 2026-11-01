import gsap from "gsap";

import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * Pulsation continue des barres son — hors timeline (repeat: -1)
 * pour ne pas bloquer `onComplete`.
 */
export function startWakeBarsIdlePulse(wakeBars: SVGRectElement[]): void {
  if (wakeBars.length === 0) {
    return;
  }

  gsap.set(wakeBars, { transformOrigin: "50% 100%" });
  gsap.to(wakeBars, {
    scaleY: 1.6,
    duration: 0.26,
    ease: "sine.inOut",
    stagger: { each: 0.07, from: "center", yoyo: true, repeat: -1 },
  });
}

/** Démarre la pulsation idle dès que l'icône est visible. */
export function scheduleWakeBarsIdlePulse(
  tl: GsapTimeline,
  wakeBars: SVGRectElement[],
  at: number,
): void {
  tl.call(
    () => {
      startWakeBarsIdlePulse(wakeBars);
    },
    [],
    at,
  );
}
