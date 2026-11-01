import gsap from "gsap";

import { animateCornersFadeIn } from "@/features/intro/model/animateCornersFadeIn";
import { animateWakeSequence } from "@/features/intro/model/animateWakeSequence";
import { blinkCoreTwice } from "@/features/intro/model/blinkCoreTwice";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { padTimelineToDuration } from "@/features/intro/model/padTimelineToDuration";
import { prepareHiddenTargets } from "@/features/intro/model/prepareHiddenTargets";
import { prepareMarkParts } from "@/features/intro/model/prepareMarkParts";
import { scheduleDialIdleSpin } from "@/features/intro/model/startDialIdleSpin";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { INTRO_DURATION_FULL_MS } from "@/lib/intro/timings";

/**
 * Wake → centre → coins/équerres → spin idle (rythme splash volontairement posé).
 */
export function buildFullIntroTimeline(
  targets: IntroTimelineTargets,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete,
  });

  prepareHiddenTargets(targets);
  prepareMarkParts(targets);

  const afterWake = animateWakeSequence(tl, targets, 0.2);

  tl.to(targets.mark, { opacity: 1, scale: 1, duration: 0.55 }, afterWake);

  const afterBlink = blinkCoreTwice(tl, targets.core, afterWake + 0.4);

  tl.to(
    targets.ringOuter,
    { strokeDashoffset: 0, duration: 1.7, ease: "power2.inOut" },
    afterBlink,
  );

  tl.to(targets.ringDial, { opacity: 1, duration: 0.7 }, afterBlink + 0.65);
  if (targets.ringAccents.length > 0) {
    tl.to(
      targets.ringAccents,
      { opacity: 1, duration: 0.85, stagger: 0.1 },
      afterBlink + 0.5,
    );
  }

  const trailStart = afterBlink + 0.9;
  tl.to(
    targets.trail,
    { strokeDashoffset: 0, duration: 1.9, ease: "power2.inOut" },
    trailStart,
  );

  const finale = trailStart + 1.7;
  tl.to(
    targets.head,
    { opacity: 1, scale: 1, duration: 0.65, ease: "power2.out" },
    finale,
  );
  tl.to(targets.wordmark, { opacity: 1, y: 0, duration: 0.75 }, finale);
  if (targets.greeting) {
    tl.to(targets.greeting, { opacity: 1, y: 0, duration: 0.75 }, finale);
  }

  animateCornersFadeIn(
    tl,
    { hudCorners: targets.hudCorners, hudBrackets: targets.hudBrackets },
    finale + 0.7,
  );

  padTimelineToDuration(tl, Math.max(INTRO_DURATION_FULL_MS / 1000, 8.5));
  scheduleDialIdleSpin(tl, targets.ringDial);

  return tl;
}
