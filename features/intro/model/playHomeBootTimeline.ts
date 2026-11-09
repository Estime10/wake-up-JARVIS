import gsap from "gsap";

import { prefersReducedMotion } from "@/lib/motion/reducedMotion";

const OUT_SOFT = "power2.out";
const IN_OUT = "power2.inOut";

type PlayHomeBootTimelineArgs = {
  root: HTMLElement;
  onComplete: () => void;
};

/**
 * Boot sur home — scan + révélation du wordmark **page** (sous le mark).
 * Le nom reste visible à la fin (pas de fade-out) : même nœud que le home.
 */
export function playHomeBootTimeline({
  root,
  onComplete,
}: PlayHomeBootTimelineArgs): () => void {
  const scan = root.querySelector<HTMLElement>("[data-boot-scan]");
  // Wordmark live dans AssistantStage — pas un doublon overlay.
  const wordmark = root.ownerDocument.querySelector<HTMLElement>(
    '[data-intro="wordmark"]',
  );
  const letters = wordmark
    ? [...wordmark.querySelectorAll<HTMLElement>("[data-wordmark-letter]")]
    : [];

  if (prefersReducedMotion()) {
    if (scan) {
      gsap.set(scan, { opacity: 0 });
    }
    if (wordmark) {
      gsap.set(wordmark, { opacity: 1, y: 0 });
    }
    if (letters.length > 0) {
      gsap.set(letters, { opacity: 1, y: 0 });
    }
    onComplete();
    return () => {};
  }

  if (scan) {
    gsap.set(scan, { y: "-20vh", opacity: 0 });
  }
  if (letters.length > 0) {
    gsap.set(letters, { opacity: 0, y: 12 });
    gsap.set(wordmark, { opacity: 1, y: 0 });
  } else if (wordmark) {
    gsap.set(wordmark, { opacity: 0, y: 12 });
  }

  const tl = gsap.timeline({
    defaults: { ease: OUT_SOFT },
    onComplete,
  });

  // Nom E.L.S.A. — reste en place ensuite
  if (letters.length > 0) {
    tl.to(
      letters,
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: OUT_SOFT },
      0.15,
    );
  } else if (wordmark) {
    tl.to(wordmark, { opacity: 1, y: 0, duration: 0.45, ease: OUT_SOFT }, 0.15);
  }

  // Double passage scan
  if (scan) {
    tl.to(scan, { opacity: 1, duration: 0.2 }, 0.35);
    tl.to(scan, { y: "110vh", duration: 1.35, ease: IN_OUT }, 0.4);
    tl.set(scan, { y: "-20vh" });
    tl.to(scan, { y: "110vh", duration: 1.35, ease: IN_OUT });
    tl.to(scan, { opacity: 0, duration: 0.25 }, "-=0.15");
  }

  // Filet si rien à animer
  if (tl.duration() < 0.05) {
    onComplete();
  }

  return () => {
    tl.kill();
  };
}
