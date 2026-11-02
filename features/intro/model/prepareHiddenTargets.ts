import gsap from "gsap";

import { prepareWakeTargets } from "@/features/intro/model/animateWakeSequence";
import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";

/** Cache mark + wake (splash minimal). */
export function prepareHiddenTargets(targets: IntroTimelineTargets): void {
  gsap.set(targets.mark, {
    scale: 1,
    opacity: 0,
    x: 0,
    y: 0,
    transformOrigin: "50% 50%",
  });
  prepareWakeTargets(targets);
}
