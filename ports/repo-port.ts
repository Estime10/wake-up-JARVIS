import type {
  RepoBranch,
  RepoCommit,
  RepoFileContent,
  RepoPull,
  RepoSummary,
  RepoTreeNode,
} from "@/lib/schemas";

/** Lecture seule dépôts GitHub — ADR 0011 étape 2. */
export interface RepoPort {
  listRepos(): Promise<RepoSummary[]>;
  listBranches(repoId: string, defaultBranch: string): Promise<RepoBranch[]>;
  listTree(repoId: string, ref?: string): Promise<RepoTreeNode[]>;
  listCommits(repoId: string, ref?: string): Promise<RepoCommit[]>;
  listPulls(repoId: string): Promise<RepoPull[]>;
  getFile(repoId: string, path: string, ref?: string): Promise<RepoFileContent>;
}
