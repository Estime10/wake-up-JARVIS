import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";

/** Cache mark / textes — scale 1 dès le départ (pas de zoom latéral). */
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
}
