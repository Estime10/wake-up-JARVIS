/** Décompose `owner/repo` (full_name GitHub). */
export function parseRepoId(
  id: string,
): { owner: string; repo: string } | null {
  const trimmed = id.trim();
  const slash = trimmed.indexOf("/");
  if (slash <= 0 || slash === trimmed.length - 1) {
    return null;
  }
  if (trimmed.includes("/") && trimmed.indexOf("/", slash + 1) !== -1) {
    // un seul slash attendu (owner/repo)
    return null;
  }
  return {
    owner: trimmed.slice(0, slash),
    repo: trimmed.slice(slash + 1),
  };
}
