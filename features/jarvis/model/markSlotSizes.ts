/** Classes taille MarkSlot — splash (intro / terminal) vs home. */

export const MARK_SLOT_SIZE = {
  splash: "size-[min(72vw,22rem)] sm:size-[min(52vw,28rem)]",
  /**
   * Home = splash (refonte-ui) : pas de scale-down après splash ;
   * le mark reste plein centre à la même taille.
   */
  home: "size-[min(72vw,22rem)] sm:size-[min(52vw,28rem)]",
} as const;

/**
 * Réserve sous le MarkSlot home pour le chrome splash (overflow visible).
 * ≈ 24 % du viewBox 248 (réticules ~y 302) → calé en rem stables.
 */
export const MARK_HOME_CHROME_BELOW = "h-14 sm:h-16";
