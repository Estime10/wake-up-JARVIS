/**
 * Nom affiché depuis `From` — « Alice <a@b.c> » → « Alice », sinon l’adresse brute.
 */
export function mailSenderDisplayName(fromRaw: string): string {
  const trimmed = fromRaw.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  const named = trimmed.match(/^"?([^"<]+)"?\s*</);
  const name = named?.[1]?.trim();
  if (name) {
    return name;
  }
  return trimmed.replace(/^<|>$/g, "").trim();
}
