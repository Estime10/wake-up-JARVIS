/**
 * Surface overlay HUD partagée — terminal + tiroir GitHub.
 * Une seule couche : même DOM / mêmes classes (pas de Button ghost qui
 * peut absorber `bg-*` / affaiblir le rendu du blur).
 */
export const HUD_OVERLAY_SURFACE_CLASS =
  "bg-bg/85 backdrop-blur-[var(--blur-glass)]";

/** Fade overlay + contenu home (terminal et GitHub). */
export const HUD_OVERLAY_MOTION_CLASS =
  "transition-opacity duration-300 ease-in-out";
