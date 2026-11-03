import type { GsapTimeline } from "@/lib/gsap/timelineType";

const WORDMARK_REVEAL_SECONDS = 0.45;

/**
 * Révèle JARVIS après l’anim mark — juste avant wake / TTS.
 * @returns position timeline de fin du tween (pour pad / onComplete).
 */
export function revealWordmark(
  tl: GsapTimeline,
  wordmark: HTMLElement | null,
  at: number,
): number {
  if (!wordmark) {
    return at;
  }

  tl.to(
    wordmark,
    {
      opacity: 1,
      y: 0,
      duration: WORDMARK_REVEAL_SECONDS,
      ease: "power2.out",
    },
    at,
  );

  return at + WORDMARK_REVEAL_SECONDS;
}

export { WORDMARK_REVEAL_SECONDS };
