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
