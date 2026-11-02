/** États d’aperçu fichier. */
export const REPO_PREVIEW_KINDS = [
  "nominal",
  "loading",
  "tooLarge",
  "binary",
  "protected",
  "masked",
  "offline",
  "error",
] as const;

export type RepoPreviewKind = (typeof REPO_PREVIEW_KINDS)[number];
