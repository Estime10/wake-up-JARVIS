import gsap from "gsap";

import type { IntroTimelineTargets } from "@/features/intro/model/introTimelineTargets";
import { prepareDrawStroke } from "@/features/intro/model/prepareDrawStroke";

/** État initial des pièces du logo avant la timeline motion. */
export function prepareMarkParts(targets: IntroTimelineTargets): void {
  prepareDrawStroke(targets.ringOuter);
  prepareDrawStroke(targets.trail);

  gsap.set(targets.ringDial, { opacity: 0 });
  if (targets.ringAccents.length > 0) {
    gsap.set(targets.ringAccents, { opacity: 0 });
  }
  // Noyau : uniquement opacity (pas de scale → pas de dérive visuelle).
  gsap.set(targets.core, { opacity: 0, scale: 1, x: 0, y: 0 });
  gsap.set(targets.head, {
    opacity: 0,
    scale: 0.35,
    svgOrigin: "317.6 86.9",
  });
}
