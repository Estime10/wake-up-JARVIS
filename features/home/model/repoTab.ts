const REPO_TABS = ["files", "commits", "pr"] as const;

export type RepoTab = (typeof REPO_TABS)[number];

export { REPO_TABS };
