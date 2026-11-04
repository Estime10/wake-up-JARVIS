import gsap from "gsap";

import { placeMarkOnSplashRing } from "@/features/intro/model/placeMarkOnSplashRing";
import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { Flip } from "@/lib/gsap/flip";

/**
 * Fin de splash : PersistentMark reprend la pose du ring SVG, scène masquée.
 * (Après fade du titre — voir `playSplashExitHandoff`.)
 */
export function captureSplashMarkHandoff(
  mark: HTMLElement | null,
): SplashEnterSnapshot | null {
  if (!mark || typeof document === "undefined") {
    return null;
  }

  if (!placeMarkOnSplashRing(mark)) {
    return null;
  }

  const scene = document.querySelector("[data-splash-scene]");
  if (scene) {
    gsap.set(scene, { opacity: 0 });
    const host = scene.parentElement;
    if (host instanceof HTMLElement) {
      gsap.set(host, { opacity: 0, pointerEvents: "none" });
    }
  }

  return Flip.getState(mark);
}
