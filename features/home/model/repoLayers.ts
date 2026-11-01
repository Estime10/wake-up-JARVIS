/**
 * Empilement REPO (bas → haut) :
 * mask → hit → tiroir fichiers → tiroir aperçu.
 *
 * Au-dessus du PersistentMark (z-60) pour que l’orb ne flotte
 * pas par-dessus l’aperçu fichier ; sous le modal terminal (z-65).
 */
export const REPO_LAYER_CLASS = {
  mask: "z-[61]",
  blur: "z-[62]",
  hit: "z-[62]",
  panel: "z-[63]",
  preview: "z-[64]",
} as const;
