import type { RepoSummary } from "@/lib/schemas";

/**
 * Résout `owner/repo` ou un nom court vers un id de dépôt listé.
 */
export function resolveRepoQuery(
  query: string,
  repos: readonly RepoSummary[],
): RepoSummary | null {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return null;
  }

  const exactId = repos.find((repo) => repo.id.toLowerCase() === q);
  if (exactId) {
    return exactId;
  }

  const byName = repos.filter((repo) => repo.name.toLowerCase() === q);
  if (byName.length === 1) {
    return byName[0]!;
  }
  if (byName.length > 1) {
    // Ambigu — préférer match owner/name si possible plus tard.
    return byName[0]!;
  }

  const partial = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(q) || repo.id.toLowerCase().includes(q),
  );
  return partial.length === 1 ? partial[0]! : (partial[0] ?? null);
}
