import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { scheduleWakeBarsIdlePulse } from "@/features/intro/model/startWakeBarsIdlePulse";
import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * 1) Icône son + pulsation
 * 2) Texte « Réveil détecté… » lettre par lettre
 */
export function animateWakeSequence(
  tl: GsapTimeline,
  targets: IntroTimelineTargets,
  at: number,
): number {
  const { wakeIcon, wakeBars, wakeChars } = targets;

  tl.to(
    wakeIcon,
    { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" },
    at,
  );

  scheduleWakeBarsIdlePulse(tl, wakeBars, at + 0.25);

  const typeAt = at + 0.7;
  const charStagger = 0.032;
  tl.to(
    wakeChars,
    {
      opacity: 1,
      duration: 0.035,
      stagger: charStagger,
      ease: "none",
    },
    typeAt,
  );

  const typedDuration =
    wakeChars.length === 0 ? 0 : (wakeChars.length - 1) * charStagger + 0.035;

  return typeAt + typedDuration + 0.25;
}

export function prepareWakeTargets(targets: IntroTimelineTargets): void {
  gsap.set(targets.wakeIcon, { opacity: 0, scale: 0.65 });
  gsap.set(targets.wakeBars, {
    scaleY: 0.45,
    transformOrigin: "50% 100%",
  });
  gsap.set(targets.wakeChars, { opacity: 0 });
}
