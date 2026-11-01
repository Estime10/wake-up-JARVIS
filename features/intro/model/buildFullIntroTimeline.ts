import gsap from "gsap";

import { animateAxisToCenter } from "@/features/intro/model/animateAxisToCenter";
import { blinkCoreTwice } from "@/features/intro/model/blinkCoreTwice";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { padTimelineToDuration } from "@/features/intro/model/padTimelineToDuration";
import { prepareHiddenTargets } from "@/features/intro/model/prepareHiddenTargets";
import { prepareMarkParts } from "@/features/intro/model/prepareMarkParts";
import { scheduleDialIdleSpin } from "@/features/intro/model/startDialIdleSpin";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { INTRO_DURATION_FULL_MS } from "@/lib/intro/timings";

/**
 * Noyau → cercle → cadran → traînée → tête + textes → axe → spin idle.
 * Rythme ralenti pour lecture visuelle.
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

  tl.to(targets.mark, { opacity: 1, scale: 1, duration: 0.65 }, 0);

  const afterBlink = blinkCoreTwice(tl, targets.core, 0.55);

  tl.to(
    targets.ringOuter,
    { strokeDashoffset: 0, duration: 2.1, ease: "power2.inOut" },
    afterBlink,
  );

  tl.to(targets.ringDial, { opacity: 1, duration: 0.9 }, afterBlink + 0.85);
  if (targets.ringAccents.length > 0) {
    tl.to(
      targets.ringAccents,
      { opacity: 1, duration: 1.1, stagger: 0.12 },
      afterBlink + 0.7,
    );
  }

  const trailStart = afterBlink + 1.15;
  tl.to(
    targets.trail,
    { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" },
    trailStart,
  );

  const finale = trailStart + 2.2;
  tl.to(
    targets.head,
    { opacity: 1, scale: 1, duration: 0.85, ease: "power2.out" },
    finale,
  );
  tl.to(targets.wordmark, { opacity: 1, y: 0, duration: 0.95 }, finale);
  if (targets.greeting) {
    tl.to(targets.greeting, { opacity: 1, y: 0, duration: 0.95 }, finale);
  }

  animateAxisToCenter(tl, targets.axis, finale + 1.1);

  padTimelineToDuration(tl, Math.max(INTRO_DURATION_FULL_MS / 1000, 9.5));
  scheduleDialIdleSpin(tl, targets.ringDial);

  return tl;
}
