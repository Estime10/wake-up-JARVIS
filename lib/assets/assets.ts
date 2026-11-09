/**
 * Chemins des fichiers servis depuis `public/`.
 * Importer depuis ici — jamais de chemins en dur dispersés dans l'app.
 */

/** Mark v2 nacré — pour `<img>` (currentColor ne traverse pas img). */
export const jarvisMark = "/brand/jarvis-mark-pearl.svg";
export const jarvisMarkMono = "/brand/jarvis-mark.svg";
export const jarvisMarkLayers = "/brand/jarvis-mark-layers.svg";

export const icons = {
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  iconMaskable512: "/icons/icon-maskable-512.png",
} as const;

export const assets = {
  jarvisMark,
  jarvisMarkMono,
  jarvisMarkLayers,
  icons,
} as const;
