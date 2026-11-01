import type { GsapTimeline } from "@/lib/gsap/timelineType";

/** Ajoute un tween vide pour atteindre une durée cible (secondes). */
export function padTimelineToDuration(
  tl: GsapTimeline,
  targetSeconds: number,
): void {
  const pad = Math.max(0, targetSeconds - tl.duration());
  if (pad > 0) {
    tl.to({}, { duration: pad });
  }
}
