import type { RepoTab } from "@/features/home/model/repoTab";
import type {
  RepoBranch,
  RepoCommit,
  RepoPull,
  RepoSummary,
  RepoTreeNode,
} from "@/lib/schemas";

/** Fraîcheur session SPA — alignée sur l’idée « poll 1 h », sans hit GitHub en fond. */
export const LIVE_REPO_CACHE_TTL_MS = 60 * 60_000;

export type LiveRepoDetailSnapshot = {
  branches: RepoBranch[];
  tree: RepoTreeNode[];
  commits: RepoCommit[];
  pulls: RepoPull[];
  fetchedAt: number;
};

export type LiveRepoListSnapshot = {
  repos: RepoSummary[];
  fetchedAt: number;
};

export type LiveRepoSelectionSnapshot = {
  repoId: string;
  branch: string;
  tab: RepoTab;
};

type CacheState = {
  list: LiveRepoListSnapshot | null;
  details: Map<string, LiveRepoDetailSnapshot>;
  selection: LiveRepoSelectionSnapshot | null;
};

const state: CacheState = {
  list: null,
  details: new Map(),
  selection: null,
};

export function liveRepoDetailKey(repoId: string, ref: string): string {
  return `${repoId}@${ref}`;
}

export function isLiveRepoCacheFresh(
  fetchedAt: number,
  now: number = Date.now(),
  ttlMs: number = LIVE_REPO_CACHE_TTL_MS,
): boolean {
  return now - fetchedAt <= ttlMs;
}

export function getLiveRepoListCache(): LiveRepoListSnapshot | null {
  return state.list;
}

export function setLiveRepoListCache(repos: RepoSummary[]): void {
  state.list = { repos, fetchedAt: Date.now() };
}

export function getLiveRepoDetailCache(
  key: string,
): LiveRepoDetailSnapshot | null {
  return state.details.get(key) ?? null;
}

export function setLiveRepoDetailCache(
  key: string,
  detail: Omit<LiveRepoDetailSnapshot, "fetchedAt">,
): void {
  state.details.set(key, { ...detail, fetchedAt: Date.now() });
}

export function getLiveRepoSelectionCache(): LiveRepoSelectionSnapshot | null {
  return state.selection;
}

export function setLiveRepoSelectionCache(
  selection: LiveRepoSelectionSnapshot,
): void {
  state.selection = selection;
}

/** Purge à la déconnexion — évite de servir des données d’un autre compte. */
export function clearLiveRepoSessionCache(): void {
  state.list = null;
  state.details.clear();
  state.selection = null;
}
