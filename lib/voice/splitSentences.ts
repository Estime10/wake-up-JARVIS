/**
 * Découpe un texte FR en phrases pour synthèse progressive (Piper).
 * Conserve la ponctuation finale sur chaque segment.
 */
export function splitSentences(text: string): string[] {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0) {
    return [];
  }

  const parts = trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/gu);
  if (!parts) {
    return [trimmed];
  }

  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}
