import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { scheduleWakeBarsIdlePulse } from "@/features/intro/model/startWakeBarsIdlePulse";
import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * 1) Icône son (apparition) + pulsation continue des barres
 * 2) Texte « Réveil détecté… » lettre par lettre
 * Retourne le temps de fin de séquence sur la timeline.
 */
export function animateWakeSequence(
  tl: GsapTimeline,
  targets: IntroTimelineTargets,
  at: number,
): number {
  const { wakeIcon, wakeBars, wakeChars } = targets;

  tl.to(
    wakeIcon,
    { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" },
    at,
  );

  // Pulsation continue jusqu'à la fin (et au-delà en idle) — hors timeline
  scheduleWakeBarsIdlePulse(tl, wakeBars, at + 0.35);

  const typeAt = at + 0.9;
  const charStagger = 0.038;
  tl.to(
    wakeChars,
    {
      opacity: 1,
      duration: 0.04,
      stagger: charStagger,
      ease: "none",
    },
    typeAt,
  );

  const typedDuration =
    wakeChars.length === 0 ? 0 : (wakeChars.length - 1) * charStagger + 0.04;

  return typeAt + typedDuration + 0.35;
}

/** État initial wake — hors reduced motion. */
export function prepareWakeTargets(targets: IntroTimelineTargets): void {
  gsap.set(targets.wakeIcon, { opacity: 0, scale: 0.65 });
  gsap.set(targets.wakeBars, {
    scaleY: 0.45,
    transformOrigin: "50% 100%",
  });
  gsap.set(targets.wakeChars, { opacity: 0 });
}
