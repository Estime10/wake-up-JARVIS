/**
 * Empilement REPO (bas → haut) :
 * mask → hit → tiroir fichiers → tiroir aperçu.
 *
 * Mask au-dessus du PersistentMark (z-60) — même niveau d’empilement
 * que l’overlay terminal (z-61).
 */
export const REPO_LAYER_CLASS = {
  mask: "z-[61]",
  hit: "z-[62]",
  panel: "z-[63]",
  preview: "z-[64]",
} as const;
