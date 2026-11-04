/** Classes taille MarkSlot — splash (intro / terminal) vs home. */

export const MARK_SLOT_SIZE = {
  splash: "size-[min(72vw,22rem)] sm:size-[min(52vw,28rem)]",
  /** Home : ring viewBox 248 ; le chrome (réticules) déborde — voir `MARK_HOME_CHROME_BELOW`. */
  home: "size-[min(46vw,14.5rem)] sm:size-[min(32vw,15.5rem)]",
} as const;

/**
 * Réserve sous le MarkSlot home pour le chrome splash (overflow visible).
 * ≈ 24 % du viewBox 248 (réticules ~y 302) → calé en rem stables.
 */
export const MARK_HOME_CHROME_BELOW = "h-14 sm:h-16";
