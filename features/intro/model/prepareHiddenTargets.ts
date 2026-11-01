import gsap from "gsap";

import { prepareCornersHidden } from "@/features/intro/model/animateCornersFadeIn";
import { prepareWakeTargets } from "@/features/intro/model/animateWakeSequence";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";

/** Cache mark / textes / wake / coins / équerres. */
export function prepareHiddenTargets(targets: IntroTimelineTargets): void {
  gsap.set(targets.mark, {
    scale: 1,
    opacity: 0,
    x: 0,
    y: 0,
    transformOrigin: "50% 50%",
  });
  gsap.set(targets.wordmark, { opacity: 0, y: 14 });
  if (targets.greeting) {
    gsap.set(targets.greeting, { opacity: 0, y: 10 });
  }
  prepareWakeTargets(targets);
  prepareCornersHidden({
    hudCorners: targets.hudCorners,
    hudBrackets: targets.hudBrackets,
  });
}
