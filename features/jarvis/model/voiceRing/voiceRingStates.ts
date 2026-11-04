import gsap from "gsap";

import { MARK_SVG_ORIGIN } from "@/components/ui/JarvisMark/voiceRingGeometry";
import type { RingLayers } from "@/features/jarvis/model/voiceRing/voiceRingLayers";
import { startDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import {
  startSplashChromeIdle,
  stopSplashChromeIdle,
} from "@/features/jarvis/model/startSplashChromeIdle";
import { THINK_SPIN_SECONDS } from "@/lib/intro/timings";

export type RingStateOptions = { reducedMotion: boolean };

/** Entrée dans un état : pose le mouvement, renvoie son arrêt. */
export type EnterRingState = (
  layers: RingLayers,
  opts: RingStateOptions,
) => () => void;

const NO_CLEANUP = (): void => {};

/** Cadran + chrome boot figés (erreur, hors ligne, modes actifs). */
function freezeDial(layers: RingLayers): void {
  if (layers.dial) {
    gsap.killTweensOf(layers.dial);
  }
  if (layers.root) {
    stopSplashChromeIdle(layers.root);
  }
}

/** Cadran + chrome boot — spin ambiant partagé (pas seulement idle). */
export function ensureAmbientSpin(
  layers: RingLayers,
  reducedMotion: boolean,
): void {
  if (reducedMotion) {
    return;
  }
  if (layers.dial) {
    startDialIdleSpin(layers.dial);
  }
  if (layers.root) {
    startSplashChromeIdle(layers.root);
  }
}

export const enterIdleRing: EnterRingState = (layers, { reducedMotion }) => {
  ensureAmbientSpin(layers, reducedMotion);
  return NO_CLEANUP;
};

export const enterThinkingRing: EnterRingState = (
  layers,
  { reducedMotion },
) => {
  ensureAmbientSpin(layers, reducedMotion);
  if (!layers.thinkGroup || reducedMotion) {
    return NO_CLEANUP;
  }
  gsap.set(layers.thinkGroup, {
    svgOrigin: MARK_SVG_ORIGIN,
    transformOrigin: "50% 50%",
  });
  gsap.to(layers.thinkGroup, {
    rotation: 360,
    duration: THINK_SPIN_SECONDS,
    ease: "none",
    repeat: -1,
  });
  return NO_CLEANUP;
};

/** Erreur : anneau rouge + triangle (groupe `mode-error`), tout figé. */
export const enterErrorRing: EnterRingState = (layers) => {
  freezeDial(layers);
  return NO_CLEANUP;
};

/** Hors ligne : tirets gris (groupe `mode-offline`), tout figé. */
export const enterOfflineRing: EnterRingState = (layers) => {
  freezeDial(layers);
  return NO_CLEANUP;
};
