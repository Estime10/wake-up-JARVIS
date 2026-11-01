import { buildFullIntroTimeline } from "@/features/intro/model/buildFullIntroTimeline";
import { buildReducedIntroTimeline } from "@/features/intro/model/buildReducedIntroTimeline";
import { buildShortIntroTimeline } from "@/features/intro/model/buildShortIntroTimeline";
import type {
  IntroTimelineOptions,
  IntroTimelineTargets,
} from "@/features/intro/model/introTimelineTargets";
import type { GsapTimeline } from "@/lib/gsap/timelineType";

/**
 * Orchestrateur : choisit la timeline selon mode / reduced motion.
 * Aucune logique GSAP ici — délègue aux builders.
 */
export function createIntroTimeline(
  targets: IntroTimelineTargets,
  options: IntroTimelineOptions,
): GsapTimeline {
  const { mode, reducedMotion, onComplete } = options;

  if (reducedMotion) {
    return buildReducedIntroTimeline(targets, onComplete);
  }

  if (mode === "short") {
    return buildShortIntroTimeline(targets, onComplete);
  }

  return buildFullIntroTimeline(targets, onComplete);
}
