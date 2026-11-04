import gsap from "gsap";

import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";

/**
 * Relais splash → PersistentMark (JarvisMark = même dessin splash).
 * Pose le mark sur le bbox du ring, cache le SVG scène, Flip.getState.
 */
export function captureSplashMarkHandoff(
  mark: HTMLElement | null,
): SplashEnterSnapshot | null {
  if (!mark || typeof document === "undefined") {
    return null;
  }

  const scene = document.querySelector("[data-splash-scene]");
  if (!scene) {
    return null;
  }

  const ring =
    scene.querySelector("#splash-ring-outer") ??
    scene.querySelector("#layer-rig");
  if (!ring) {
    return null;
  }

  const rect = ring.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    return null;
  }

  // Ring r120 = 240 u dans viewBox 248 → calage pixel-perfect.
  const diameter = Math.max(rect.width, rect.height);
  const size = diameter * (248 / 240);
  const left = rect.left + rect.width / 2 - size / 2;
  const top = rect.top + rect.height / 2 - size / 2;

  placeOnRect(mark, { top, left, width: size, height: size });
  mark.style.visibility = "visible";
  mark.style.pointerEvents = "none";
  showMark(mark);
  gsap.set(mark, { opacity: 1, clearProps: "transform" });

  // Scène SVG : le JarvisMark a pris le relais (même dessin).
  gsap.set(scene, { opacity: 0 });

  return Flip.getState(mark);
}
