/**
 * IV2-06 — allowlist stricte des scopes classic ; fine-grained aussi contrôlé.
 * Tout scope hors liste = refus (dont delete:packages, codespace, project, user,
 * repo:status, security_events, repo, write:*, admin:*).
 */
const ALLOWED_SCOPES = new Set(["read:user", "user:email", "read:org"]);

function parseScopes(header: string | null): string[] {
  return (header ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

/**
 * @returns true si le PAT est acceptable en lecture seule.
 */
export function assertReadOnlyPatScopes(
  token: string,
  xOauthScopesHeader: string | null,
): boolean {
  const trimmed = token.trim();
  const scopes = parseScopes(xOauthScopesHeader);

  // Classic sans header de scopes → indéterminé / trop large.
  if (!trimmed.startsWith("github_pat_") && scopes.length === 0) {
    return false;
  }

  // Allowlist : chaque scope déclaré doit être explicitement autorisé.
  for (const scope of scopes) {
    if (!ALLOWED_SCOPES.has(scope)) {
      return false;
    }
  }

  return true;
}

/**
 * Fine-grained (`github_pat_`) : pas de x-oauth-scopes fiable.
 * On exige le préfixe + une sonde /user OK (faite par l’appelant) et
 * on refuse si un header de scopes non vide échoue l’allowlist.
 */
export function assertFineGrainedPatShape(token: string): boolean {
  return token.trim().startsWith("github_pat_");
}
