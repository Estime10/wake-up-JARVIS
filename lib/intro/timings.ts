/** Durées en ms — miroir des tokens CSS (`--duration-intro-*`). */
export const INTRO_DURATION_FULL_MS = 2900;
export const INTRO_DURATION_SHORT_MS = 800;
export const INTRO_DURATION_REDUCED_MS = 300;

type IntroPhaseWindow = { start: number; end: number };

/**
 * Fenêtres splash « full » — wake + mark, puis wordmark (revealWordmark).
 */
export const FULL_INTRO_PHASES = {
  wake: { start: 0, end: 0.9 },
  blink: { start: 0.9, end: 1.75 },
  ring: { start: 1.75, end: 2.55 },
  dial: { start: 1.95, end: 2.55 },
  trail: { start: 2, end: 2.75 },
  head: { start: 2.55, end: 2.9 },
} as const satisfies Record<string, IntroPhaseWindow>;

/**
 * Clignotement du noyau — WCAG 2.3.1 : 2 flashs max,
 * départs espacés de flash + pause = 0,34 s (≈ 2,9 Hz < 3 Hz).
 */
export const CORE_BLINK = {
  flashSeconds: 0.14,
  pauseSeconds: 0.2,
  count: 2,
} as const;

/** Un tour complet du cadran pointillé en idle (secondes). */
export const DIAL_IDLE_SPIN_SECONDS = 36;

/** Rotation thinking — miroir `--duration-think-spin`. */
export const THINK_SPIN_SECONDS = 2.4;

/** Ouverture terminal : mark → taille splash (secondes). */
export const TERMINAL_EXPAND_SECONDS = 0.75;
