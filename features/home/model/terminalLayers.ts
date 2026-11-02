/**
 * Empilement z-index — session terminal (Tailwind arbitrary).
 * Overlay / mask au même palier que le tiroir GitHub (z-61) :
 * backdrop 61 < panneau 65 < chrome 70.
 */
export const TERMINAL_LAYER_CLASS = {
  backdrop: "z-[61]",
  panel: "z-[65]",
  chrome: "z-[70]",
} as const;
