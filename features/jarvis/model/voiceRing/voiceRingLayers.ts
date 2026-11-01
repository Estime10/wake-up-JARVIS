import gsap from "gsap";

import type { AssistantState } from "@/features/home/model/assistantMachine";

/** Un groupe SVG `data-jarvis="mode-*"` par état assistant (JarvisMark). */
export const RING_MODES: readonly AssistantState[] = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "error",
  "offline",
];

const FADE = 0.28;

export type RingLayers = {
  modes: Record<AssistantState, SVGGElement | null>;
  dial: SVGGeometryElement | null;
  spokes: SVGElement[];
  thinkGroup: SVGGElement | null;
  bars: SVGElement[];
};

export function queryRingLayers(root: HTMLElement): RingLayers {
  const mode = (name: AssistantState) =>
    root.querySelector<SVGGElement>(`[data-jarvis='mode-${name}']`);
  return {
    modes: {
      idle: mode("idle"),
      listening: mode("listening"),
      thinking: mode("thinking"),
      speaking: mode("speaking"),
      error: mode("error"),
      offline: mode("offline"),
    },
    dial: root.querySelector<SVGGeometryElement>("[data-jarvis='ring-dial']"),
    spokes: Array.from(
      root.querySelectorAll<SVGElement>("[data-jarvis='listen-spoke']"),
    ),
    thinkGroup: root.querySelector<SVGGElement>(
      "[data-jarvis='think-segments']",
    ),
    bars: Array.from(
      root.querySelectorAll<SVGElement>("[data-jarvis='speak-bar']"),
    ),
  };
}

/** Fondu enchaîné vers `mode` (opacity seule, ADR 0004). */
export function showRingMode(
  layers: RingLayers,
  mode: AssistantState,
  opts: { instant: boolean },
): void {
  for (const key of RING_MODES) {
    const el = layers.modes[key];
    if (!el) {
      continue;
    }
    const opacity = key === mode ? 1 : 0;
    gsap.killTweensOf(el);
    if (opts.instant) {
      gsap.set(el, { opacity });
      continue;
    }
    gsap.to(el, { opacity, duration: FADE, ease: "power2.out" });
  }
}

/** Coupe tout mouvement d'état (cadran, arcs, segments, barres). */
export function stopRingMotion(layers: RingLayers): void {
  const targets = [
    layers.dial,
    layers.thinkGroup,
    ...layers.spokes,
    ...layers.bars,
  ];
  for (const target of targets) {
    if (target) {
      gsap.killTweensOf(target);
    }
  }
}
