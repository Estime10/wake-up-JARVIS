/**
 * Surface overlay HUD partagée — terminal + tiroir GitHub.
 * Bornée à `<main>` via `useMainSectionBox` (le side panel reste net).
 */
export const HUD_OVERLAY_SURFACE_CLASS =
  "bg-bg/85 backdrop-blur-[var(--blur-glass)]";

/** Fade overlay + contenu home (terminal et GitHub). */
export const HUD_OVERLAY_MOTION_CLASS =
  "transition-opacity duration-300 ease-in-out";
