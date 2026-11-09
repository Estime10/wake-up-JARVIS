/**
 * Taille MarkSlot — bornée à la **colonne centrale** (parent `w-full`).
 *
 * Le chrome SVG (`overflow: visible`, crosshairs ≈ −56…304 sur viewBox 248)
 * déborde d’un facteur ~1.45. On plafonne donc le slot à ~64 % de la colonne
 * pour que le dessin reste dans le tiers milieu, sans chevaucher conversation /
 * Studio, et sans manger le libellé sous le ring.
 */
const MARK_SLOT_BOX =
  "aspect-square mx-auto h-auto w-[min(64%,42vh,15rem)] sm:w-[min(64%,46vh,17rem)]";

export const MARK_SLOT_SIZE = {
  splash: MARK_SLOT_BOX,
  home: MARK_SLOT_BOX,
} as const;

/**
 * Réserve sous le MarkSlot pour le chrome SVG (réticules) — en flux pour
 * laisser de la place au libellé / wordmark.
 */
export const MARK_HOME_CHROME_BELOW = "h-10 sm:h-12";
