import gsap from "gsap";

import { blinkCoreTwice } from "@/features/intro/model/blinkCoreTwice";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { padTimelineToDuration } from "@/features/intro/model/padTimelineToDuration";
import { prepareHiddenTargets } from "@/features/intro/model/prepareHiddenTargets";
import { prepareMarkParts } from "@/features/intro/model/prepareMarkParts";
import { scheduleDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import { scheduleWakeBarsIdlePulse } from "@/features/intro/model/startWakeBarsIdlePulse";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { INTRO_DURATION_SHORT_MS } from "@/lib/intro/timings";

/** Version courte — wake + mark seulement. */
export function buildShortIntroTimeline(
  targets: IntroTimelineTargets,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete,
  });

  prepareHiddenTargets(targets);
  prepareMarkParts(targets);

  tl.to(targets.wakeIcon, { opacity: 1, scale: 1, duration: 0.2 }, 0);
  scheduleWakeBarsIdlePulse(tl, targets.wakeBars, 0.1);
  tl.to(targets.wakeChars, { opacity: 1, duration: 0.15 }, 0.15);

  const afterWake = 0.35;
  tl.to(targets.mark, { opacity: 1, scale: 1, duration: 0.2 }, afterWake);
  const afterBlink = blinkCoreTwice(tl, targets.core, afterWake + 0.1);

  tl.to(
    targets.ringOuter,
    { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut" },
    afterBlink,
  );
  tl.to(targets.ringDial, { opacity: 1, duration: 0.25 }, afterBlink + 0.2);
  if (targets.ringAccents.length > 0) {
    tl.to(
      targets.ringAccents,
      { opacity: 1, duration: 0.3 },
      afterBlink + 0.15,
    );
  }
  tl.to(
    targets.trail,
    { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" },
    afterBlink + 0.25,
  );

  const headAt = afterBlink + 0.65;
  tl.to(targets.head, { opacity: 1, scale: 1, duration: 0.25 }, headAt);

  padTimelineToDuration(tl, Math.max(INTRO_DURATION_SHORT_MS / 1000, 1.8));
  scheduleDialIdleSpin(tl, targets.ringDial);

  return tl;
}
