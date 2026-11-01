import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { INTRO_DURATION_REDUCED_MS } from "@/lib/intro/timings";

/** Reduced motion : logo + textes complets en fondu, pas de tracé. */
export function buildReducedIntroTimeline(
  targets: IntroTimelineTargets,
  onComplete: () => void,
): GsapTimeline {
  const tl = gsap.timeline({
    defaults: { ease: "power1.out" },
    onComplete,
  });

  gsap.set(targets.mark, { scale: 1, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set(targets.wordmark, { opacity: 0, y: 0 });
  gsap.set(targets.axis, { opacity: 0, y: 0 });
  gsap.set(
    [
      targets.ringOuter,
      targets.ringDial,
      ...targets.ringAccents,
      targets.trail,
      targets.head,
      targets.core,
    ],
    { opacity: 1, scale: 1, strokeDashoffset: 0 },
  );
  if (targets.greeting) {
    gsap.set(targets.greeting, { opacity: 0, y: 0 });
  }

  const fadeTargets: gsap.TweenTarget[] = [
    targets.mark,
    targets.wordmark,
    targets.axis,
  ];
  if (targets.greeting) {
    fadeTargets.push(targets.greeting);
  }

  tl.to(fadeTargets, {
    opacity: 1,
    duration: INTRO_DURATION_REDUCED_MS / 1000,
  });

  return tl;
}
