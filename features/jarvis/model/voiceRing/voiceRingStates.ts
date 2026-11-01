import gsap from "gsap";

import type { RingLayers } from "@/features/jarvis/model/voiceRing/voiceRingLayers";
import { startDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import { THINK_SPIN_SECONDS } from "@/lib/intro/timings";

export type RingStateOptions = { reducedMotion: boolean };

/** Entrée dans un état : pose le mouvement, renvoie son arrêt. */
export type EnterRingState = (
  layers: RingLayers,
  opts: RingStateOptions,
) => () => void;

const NO_CLEANUP = (): void => {};

/** Cadran figé : aucun tween dessus (erreur, hors ligne). */
function freezeDial(layers: RingLayers): void {
  if (layers.dial) {
    gsap.killTweensOf(layers.dial);
  }
}

export const enterIdleRing: EnterRingState = (layers, { reducedMotion }) => {
  if (layers.dial && !reducedMotion) {
    startDialIdleSpin(layers.dial);
  }
  return NO_CLEANUP;
};

export const enterThinkingRing: EnterRingState = (
  layers,
  { reducedMotion },
) => {
  if (!layers.thinkGroup || reducedMotion) {
    return NO_CLEANUP;
  }
  gsap.set(layers.thinkGroup, {
    svgOrigin: "256 256",
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
