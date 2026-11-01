/** Scénarios mock du panneau REPO — alignés maquettes v3. */
export const REPO_PANEL_SCENARIOS = [
  "nominal",
  "loading",
  "emptyCommits",
  "emptyRepos",
  "error",
  "offline",
  "disconnected",
  "denied",
] as const;

export type RepoPanelScenario = (typeof REPO_PANEL_SCENARIOS)[number];

/** États d’aperçu fichier — alignés maquettes v3. */
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
