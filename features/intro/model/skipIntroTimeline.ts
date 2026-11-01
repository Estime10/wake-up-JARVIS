import type { GsapTimeline } from "@/lib/gsap/timelineType";

/** Coupe la timeline à la fin (`progress(1)`), sinon fallback. */
export function skipIntroTimeline(
  timeline: GsapTimeline | null,
  fallback: () => void,
): void {
  if (!timeline) {
    fallback();
    return;
  }
  timeline.progress(1);
}
