import gsap from "gsap";

import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";

/**
 * Aligne le PersistentMark (JarvisMark React) sur le bbox du ring splash.
 * Le SVG `#layer-rig` est masqué — un seul dessin visible pendant tout le splash.
 */
export function placeMarkOnSplashRing(mark: HTMLElement | null): boolean {
  if (!mark || typeof document === "undefined") {
    return false;
  }

  const scene = document.querySelector("[data-splash-scene]");
  if (!scene) {
    return false;
  }

  const ring =
    scene.querySelector("#splash-ring-outer") ??
    scene.querySelector("#layer-rig");
  if (!ring) {
    return false;
  }

  const rect = ring.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    return false;
  }

  // Ring r120 = 240 u dans viewBox 248 → calage pixel-perfect.
  const diameter = Math.max(rect.width, rect.height);
  const size = diameter * (248 / 240);
  const left = rect.left + rect.width / 2 - size / 2;
  const top = rect.top + rect.height / 2 - size / 2;

  placeOnRect(mark, { top, left, width: size, height: size });
  mark.style.visibility = "visible";
  mark.style.pointerEvents = "none";
  // Au-dessus de l’overlay splash (z-50/60).
  mark.style.zIndex = "70";
  showMark(mark);
  gsap.set(mark, { opacity: 1, clearProps: "transform" });
  return true;
}
