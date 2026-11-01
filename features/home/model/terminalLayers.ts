/** Empilement z-index — session terminal (Tailwind arbitrary). */
export const TERMINAL_LAYER_CLASS = {
  slot: "z-[15]",
  /** Sous le mark (z-60) et la modale — dim plein écran. */
  backdrop: "z-[55]",
  modal: "z-[65]",
  chrome: "z-[70]",
} as const;
