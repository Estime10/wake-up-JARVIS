/**
 * Chemins des fichiers servis depuis `public/`.
 * Importer depuis ici — jamais de chemins en dur dispersés dans l'app.
 */

export const jarvisMark = "/assets/jarvis-mark.svg";

export const icons = {
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  iconMaskable512: "/icons/icon-maskable-512.png",
} as const;

export const assets = {
  jarvisMark,
  icons,
} as const;
