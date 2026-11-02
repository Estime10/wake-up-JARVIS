/**
 * Libellé onglet — sans `@gmail.com` (connnu) ; autres domaines : local complet.
 * Ex. `estimevangu@gmail.com` → `estimevangu` ;
 *     `foo@estimevangu.pro` → `foo` (pas gmail : on garde le local seul aussi).
 */
export function mailboxShortLabel(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, at);
}
