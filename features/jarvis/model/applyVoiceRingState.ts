import gsap from "gsap";

import type { AssistantState } from "@/features/home/model/assistantMachine";
import { subscribeMockVoiceLevel } from "@/features/jarvis/model/mockVoiceLevel";
import { startDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import { THINK_SPIN_SECONDS } from "@/lib/intro/timings";

const FADE = 0.28;

type RingLayers = {
  idle: SVGGElement | null;
  listening: SVGGElement | null;
  thinking: SVGGElement | null;
  speaking: SVGGElement | null;
  dial: SVGGeometryElement | null;
  spokes: SVGElement[];
  thinkGroup: SVGGElement | null;
  bars: SVGElement[];
};

function queryLayers(root: HTMLElement): RingLayers {
  return {
    idle: root.querySelector<SVGGElement>("[data-jarvis='mode-idle']"),
    listening: root.querySelector<SVGGElement>(
      "[data-jarvis='mode-listening']",
    ),
    thinking: root.querySelector<SVGGElement>("[data-jarvis='mode-thinking']"),
    speaking: root.querySelector<SVGGElement>("[data-jarvis='mode-speaking']"),
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

function showMode(
  layers: RingLayers,
  mode: "idle" | "listening" | "thinking" | "speaking",
  opts: { instant: boolean; muted: boolean },
): void {
  const map = {
    idle: layers.idle,
    listening: layers.listening,
    thinking: layers.thinking,
    speaking: layers.speaking,
  } as const;

  for (const [key, el] of Object.entries(map)) {
    if (!el) {
      continue;
    }
    const active = key === mode;
    const on =
      active && mode === "speaking" && opts.muted ? 0.35 : active ? 1 : 0;
    gsap.killTweensOf(el);
    if (opts.instant) {
      gsap.set(el, { opacity: on });
      continue;
    }
    gsap.to(el, {
      opacity: on,
      duration: FADE,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
}

function clearMotion(layers: RingLayers): void {
  if (layers.dial) {
    gsap.killTweensOf(layers.dial);
  }
  if (layers.thinkGroup) {
    gsap.killTweensOf(layers.thinkGroup);
  }
  for (const spoke of layers.spokes) {
    gsap.killTweensOf(spoke);
  }
  for (const bar of layers.bars) {
    gsap.killTweensOf(bar);
  }
}

/**
 * Applique l’état assistant sur le SVG mark (transform/opacity only).
 * Retourne un cleanup (niveau mock + tweens).
 */
export function applyVoiceRingState(
  root: HTMLElement,
  state: AssistantState,
  opts: { reducedMotion: boolean; muted?: boolean },
): () => void {
  const layers = queryLayers(root);
  clearMotion(layers);

  const ringState: "idle" | "listening" | "thinking" | "speaking" =
    state === "listening" ||
    state === "thinking" ||
    state === "speaking" ||
    state === "idle"
      ? state
      : "idle";

  showMode(layers, ringState, {
    instant: opts.reducedMotion,
    muted: opts.muted === true,
  });

  if (ringState === "idle") {
    if (layers.dial && !opts.reducedMotion) {
      startDialIdleSpin(layers.dial);
    }
    return () => clearMotion(layers);
  }

  if (ringState === "thinking") {
    if (layers.thinkGroup && !opts.reducedMotion) {
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
    }
    return () => clearMotion(layers);
  }

  if (ringState === "listening") {
    for (const spoke of layers.spokes) {
      gsap.set(spoke, {
        transformOrigin: "50% 100%",
        scaleY: opts.reducedMotion ? 0.55 : 0.35,
      });
    }
    if (opts.reducedMotion) {
      return () => clearMotion(layers);
    }
    const stop = subscribeMockVoiceLevel((level) => {
      for (const spoke of layers.spokes) {
        const jitter = 0.85 + Math.random() * 0.3;
        gsap.to(spoke, {
          scaleY: Math.min(1, level * jitter),
          duration: 0.08,
          ease: "none",
          overwrite: "auto",
        });
      }
    });
    return () => {
      stop();
      clearMotion(layers);
    };
  }

  // speaking
  for (const bar of layers.bars) {
    gsap.set(bar, {
      transformOrigin: "50% 50%",
      scaleY: opts.reducedMotion ? 0.6 : 0.4,
    });
  }
  if (opts.reducedMotion) {
    return () => clearMotion(layers);
  }
  const stop = subscribeMockVoiceLevel((level) => {
    for (const bar of layers.bars) {
      const jitter = 0.7 + Math.random() * 0.55;
      gsap.to(bar, {
        scaleY: Math.min(1.15, 0.25 + level * jitter),
        duration: 0.09,
        ease: "none",
        overwrite: "auto",
      });
    }
  });
  return () => {
    stop();
    clearMotion(layers);
  };
}
