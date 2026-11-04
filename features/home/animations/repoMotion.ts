/**
 * Tokens motion panneau REPO (CSS transitions).
 * Source unique — durée + classes slide/fade.
 */
export const REPO_MOTION_MS = 400;

export const REPO_MOTION_CLASS =
  "transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** Tiroir fichiers / mask — état ouvert. */
export const REPO_SLIDE_IN = "translate-x-0";

/** Tiroir fichiers — hors viewport à gauche. */
export const REPO_SLIDE_OUT = "-translate-x-full";

/** Mask — opacités. */
export const REPO_FADE_IN = "opacity-100";
export const REPO_FADE_OUT = "opacity-0";
