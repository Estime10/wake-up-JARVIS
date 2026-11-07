/**
 * IV2-06 — refuse les PAT classic avec scopes d’écriture.
 * Fine-grained (`github_pat_…`) : accepté (permissions bornées côté GitHub).
 */
const DENIED_CLASSIC = new Set([
  "repo",
  "public_repo",
  "workflow",
  "delete_repo",
  "gist",
  "write:packages",
  "write:org",
  "write:discussion",
  "admin:org",
  "admin:public_key",
  "admin:repo_hook",
  "admin:org_hook",
  "admin:gpg_key",
  "admin:enterprise",
  "admin:ssh_signing_key",
]);

export function assertReadOnlyPatScopes(
  token: string,
  xOauthScopesHeader: string | null,
): boolean {
  const trimmed = token.trim();
  if (trimmed.startsWith("github_pat_")) {
    return true;
  }

  const scopes = (xOauthScopesHeader ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);

  for (const scope of scopes) {
    if (DENIED_CLASSIC.has(scope)) {
      return false;
    }
    if (scope.startsWith("write:") || scope.startsWith("admin:")) {
      return false;
    }
  }

  return true;
}
