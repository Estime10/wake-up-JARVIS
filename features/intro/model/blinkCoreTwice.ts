import type { GsapTimeline } from "@/lib/gsap/timelineType";
import { CORE_BLINK } from "@/lib/intro/timings";

const CORE_DIM_OPACITY = 0.12;

/**
 * Noyau au centre : clignote `CORE_BLINK.count` fois puis s'allume.
 * Un flash = montée + descente en `flashSeconds`, suivi de `pauseSeconds`.
 * Uniquement opacity — aucun déplacement.
 */
export function blinkCoreTwice(
  tl: GsapTimeline,
  core: SVGGElement,
  at: number,
  settleSeconds: number = CORE_BLINK.flashSeconds,
): number {
  const { flashSeconds, pauseSeconds, count } = CORE_BLINK;
  const half = flashSeconds / 2;

  let t = at;
  for (let flash = 0; flash < count; flash += 1) {
    tl.to(core, { opacity: 1, duration: half, ease: "none" }, t);
    tl.to(
      core,
      { opacity: CORE_DIM_OPACITY, duration: half, ease: "none" },
      t + half,
    );
    t += flashSeconds + pauseSeconds;
  }
  tl.to(core, { opacity: 1, duration: settleSeconds, ease: "power1.out" }, t);

  return t + settleSeconds;
}
