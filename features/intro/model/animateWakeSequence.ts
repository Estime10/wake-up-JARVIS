import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { scheduleWakeBarsIdlePulse } from "@/features/intro/model/startWakeBarsIdlePulse";
import type { GsapTimeline } from "@/lib/gsap/timelineType";

const ICON_FADE_SECONDS = 0.3;
const BARS_PULSE_DELAY_SECONDS = 0.15;
const TYPE_DELAY_SECONDS = 0.25;
const CHAR_FADE_SECONDS = 0.035;

/**
 * 1) Icône son + pulsation
 * 2) Texte « Réveil détecté… » lettre par lettre, tapé dans la fenêtre
 *    `[start, end]` (cadence calculée selon la longueur du texte).
 */
export function animateWakeSequence(
  tl: GsapTimeline,
  targets: IntroTimelineTargets,
  phase: { start: number; end: number },
): number {
  const { wakeIcon, wakeBars, wakeChars } = targets;
  const { start, end } = phase;

  tl.to(
    wakeIcon,
    { opacity: 1, scale: 1, duration: ICON_FADE_SECONDS, ease: "power2.out" },
    start,
  );

  scheduleWakeBarsIdlePulse(tl, wakeBars, start + BARS_PULSE_DELAY_SECONDS);

  const typeAt = start + TYPE_DELAY_SECONDS;
  const typeSpan = Math.max(0, end - typeAt - CHAR_FADE_SECONDS);
  const charStagger =
    wakeChars.length > 1 ? typeSpan / (wakeChars.length - 1) : 0;
  tl.to(
    wakeChars,
    {
      opacity: 1,
      duration: CHAR_FADE_SECONDS,
      stagger: charStagger,
      ease: "none",
    },
    typeAt,
  );

  return end;
}

export function prepareWakeTargets(targets: IntroTimelineTargets): void {
  gsap.set(targets.wakeIcon, { opacity: 0, scale: 0.65 });
  gsap.set(targets.wakeBars, {
    scaleY: 0.45,
    transformOrigin: "50% 100%",
  });
  gsap.set(targets.wakeChars, { opacity: 0 });
}
