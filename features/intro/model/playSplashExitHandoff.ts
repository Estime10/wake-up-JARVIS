import gsap from "gsap";

import { captureSplashMarkHandoff } from "@/features/intro/model/captureSplashMarkHandoff";
import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";

const TITLE_EXIT_SECONDS = 0.45;

/**
 * Fin d’overlay splash **sur** home (anim SVG complète déjà jouée).
 * 1) le nom JARVIS s’en va
 * 2) PersistentMark reprend le ring, SVG retiré
 * 3) l’appelant révèle HUD + input
 */
export function playSplashExitHandoff(
  mark: HTMLElement | null,
): Promise<SplashEnterSnapshot | null> {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }

  const scene = document.querySelector("[data-splash-scene]");
  const title = scene?.querySelector("#splash-title") ?? null;
  const status = scene?.querySelector("#splash-status") ?? null;
  const sheen = scene?.querySelector("#splash-title-sheen") ?? null;
  const letters = title
    ? Array.from(title.querySelectorAll("[id^='splash-letter-']"))
    : [];

  const fadeTargets = (
    letters.length > 0 ? [...letters, status, sheen] : [title, status, sheen]
  ).filter((node): node is Element => node !== null);

  const capture = (): SplashEnterSnapshot | null =>
    captureSplashMarkHandoff(mark);

  if (fadeTargets.length === 0 || prefersReducedMotion()) {
    fadeTargets.forEach((node) => {
      gsap.set(node, { opacity: 0 });
    });
    return Promise.resolve(capture());
  }

  return new Promise((resolve) => {
    gsap.to(fadeTargets, {
      opacity: 0,
      duration: TITLE_EXIT_SECONDS,
      ease: "power2.in",
      stagger: 0.02,
      onComplete: () => {
        resolve(capture());
      },
    });
  });
}
