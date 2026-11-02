import type { RepoTab } from "@/features/home/model/repoTab";
import type { MessageKey } from "@/lib/i18n/types";

export const REPO_TAB_LABEL_KEY = {
  branches: "home.repoTabBranches",
  files: "home.repoTabFiles",
  commits: "home.repoTabCommits",
  pr: "home.repoTabPr",
} as const satisfies Record<RepoTab, MessageKey>;
