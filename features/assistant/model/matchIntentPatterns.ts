/**
 * Premier pattern qui matche (ignoreCase déjà dans les regex).
 */
export function matchIntentPatterns(
  text: string,
  patterns: readonly RegExp[],
): RegExpMatchArray | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match;
    }
  }
  return null;
}

/** Nettoie un token capturé (label / repo). */
export function sanitizeCapturedToken(raw: string): string | null {
  const cleaned = raw
    .replace(/^(?:les|des|du|de|la|le|mes|mon|ma|un|une)\s+/i, "")
    .replace(/[»"'«.,!?]+$/g, "")
    .replace(/^["«']+|["»']+$/g, "")
    .trim();
  if (cleaned.length === 0 || cleaned.length > 80) {
    return null;
  }
  return cleaned;
}
