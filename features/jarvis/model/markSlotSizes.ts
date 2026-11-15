/**
 * Taille MarkSlot — bornée à la **colonne centrale** (parent `w-full`).
 *
 * Le chrome SVG (`overflow: visible`, crosshairs ≈ −56…304 sur viewBox 248)
 * déborde d’un facteur ~1.45. On plafonne donc le slot splash à ~64 % de la
 * colonne pour que le dessin reste dans le tiers milieu.
 *
 * `home` = taille compacte post-settle (mark en haut, musique en dessous).
 */
const MARK_SLOT_SPLASH =
  "aspect-square mx-auto h-auto w-[min(64%,42vh,15rem)] sm:w-[min(64%,46vh,17rem)]";

/**
 * Largeur mark home (axe vertical avec Now Playing en dessous).
 * Compact doux ≈ 70–75 % du splash.
 */
const MARK_HOME_WIDTH = "w-[min(48%,28vh,11rem)] sm:w-[min(48%,30vh,12rem)]";

const MARK_SLOT_HOME = `aspect-square mx-auto h-auto ${MARK_HOME_WIDTH}`;

export const MARK_SLOT_SIZE = {
  splash: MARK_SLOT_SPLASH,
  home: MARK_SLOT_HOME,
} as const;

/**
 * Réserve sous le MarkSlot pour le chrome SVG (réticules) — en flux pour
 * laisser de la place au libellé / wordmark.
 */
export const MARK_HOME_CHROME_BELOW = "h-10 sm:h-12";

/** Réserve chrome sous le mark compact (settle). */
export const MARK_HOME_CHROME_BELOW_COMPACT = "h-5 sm:h-6";
