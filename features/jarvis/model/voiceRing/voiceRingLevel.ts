import gsap from "gsap";

import { subscribeMockVoiceLevel } from "@/features/jarvis/model/mockVoiceLevel";
import type { EnterRingState } from "@/features/jarvis/model/voiceRing/voiceRingStates";

/** Déphasage entre éléments (angle d'or, rad) — pas de Math.random par frame. */
const PHASE_STEP = 2.399963;
/** Vitesse de variation du jitter (rad par échantillon ~30 Hz). */
const JITTER_SPEED = 0.9;

type QuickSetter = (value: number) => void;

function jitter(
  index: number,
  tick: number,
  mid: number,
  spread: number,
): number {
  return mid + spread * Math.sin(tick * JITTER_SPEED + index * PHASE_STEP);
}

/** Une fonction quickTo par élément, alimentée par le niveau voix (PLAN §3.4). */
function driveWithLevel(
  setters: QuickSetter[],
  map: (level: number, index: number, tick: number) => number,
): () => void {
  let tick = 0;
  return subscribeMockVoiceLevel((level) => {
    tick += 1;
    setters.forEach((set, index) => {
      set(map(level, index, tick));
    });
  });
}

export const enterListeningRing: EnterRingState = (
  layers,
  { reducedMotion },
) => {
  gsap.set(layers.spokes, {
    transformOrigin: "50% 100%",
    scaleY: reducedMotion ? 0.55 : 0.35,
  });
  if (reducedMotion) {
    return () => {};
  }
  const setters = layers.spokes.map((spoke) =>
    gsap.quickTo(spoke, "scaleY", { duration: 0.08, ease: "none" }),
  );
  return driveWithLevel(setters, (level, index, tick) =>
    Math.min(1, level * jitter(index, tick, 1, 0.15)),
  );
};

export const enterSpeakingRing: EnterRingState = (
  layers,
  { reducedMotion },
) => {
  gsap.set(layers.bars, {
    transformOrigin: "50% 50%",
    scaleY: reducedMotion ? 0.6 : 0.4,
  });
  if (reducedMotion) {
    return () => {};
  }
  const setters = layers.bars.map((bar) =>
    gsap.quickTo(bar, "scaleY", { duration: 0.09, ease: "none" }),
  );
  return driveWithLevel(setters, (level, index, tick) =>
    Math.min(1.15, 0.25 + level * jitter(index, tick, 0.975, 0.275)),
  );
};
