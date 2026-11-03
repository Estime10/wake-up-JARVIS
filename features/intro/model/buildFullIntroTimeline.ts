import gsap from "gsap";

import { animateWakeSequence } from "@/features/intro/model/animateWakeSequence";
import { blinkCoreTwice } from "@/features/intro/model/blinkCoreTwice";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { padTimelineToDuration } from "@/features/intro/model/padTimelineToDuration";
import { prepareHiddenTargets } from "@/features/intro/model/prepareHiddenTargets";
import { prepareMarkParts } from "@/features/intro/model/prepareMarkParts";
import { scheduleDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import {
  CORE_BLINK,
  FULL_INTRO_PHASES,
  INTRO_DURATION_FULL_MS,
} from "@/lib/intro/timings";

const MARK_FADE_SECONDS = 0.35;
const ACCENT_STAGGER_SECONDS = 0.2;

/**
 * Splash : wake → mark. Wordmark JARVIS : une seule fois sur /home avant TTS.
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

  const { wake, blink, ring, dial, trail, head } = FULL_INTRO_PHASES;
  const span = (phase: { start: number; end: number }) =>
    phase.end - phase.start;

  animateWakeSequence(tl, targets, wake);

  tl.to(
    targets.mark,
    { opacity: 1, scale: 1, duration: MARK_FADE_SECONDS },
    blink.start - MARK_FADE_SECONDS,
  );

  const flashesEnd =
    blink.start +
    CORE_BLINK.count * (CORE_BLINK.flashSeconds + CORE_BLINK.pauseSeconds);
  blinkCoreTwice(tl, targets.core, blink.start, blink.end - flashesEnd);

  tl.to(
    targets.ringOuter,
    { strokeDashoffset: 0, duration: span(ring), ease: "power2.inOut" },
    ring.start,
  );

  tl.to(targets.ringDial, { opacity: 1, duration: span(dial) }, dial.start);
  if (targets.ringAccents.length > 0) {
    tl.to(
      targets.ringAccents,
      {
        opacity: 1,
        duration: span(dial) - ACCENT_STAGGER_SECONDS,
        stagger: { amount: ACCENT_STAGGER_SECONDS },
      },
      dial.start,
    );
  }

  tl.to(
    targets.trail,
    { strokeDashoffset: 0, duration: span(trail), ease: "power2.inOut" },
    trail.start,
  );

  tl.to(
    targets.head,
    { opacity: 1, scale: 1, duration: span(head), ease: "power2.out" },
    head.start,
  );

  padTimelineToDuration(tl, INTRO_DURATION_FULL_MS / 1000);
  scheduleDialIdleSpin(tl, targets.ringDial);

  return tl;
}
