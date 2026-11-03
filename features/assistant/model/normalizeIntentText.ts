/**
 * Normalise une saisie / phrase catalogue pour comparaison.
 * Clitiques FR (`donne-moi`, `est-il`) → espaces ; casse ignorée.
 */
export function normalizeIntentText(text: string): string {
  return text
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(
      /-(moi|toi|nous|vous|le|la|les|lui|leur|je|tu|il|elle|on|ils|elles)\b/g,
      " $1",
    )
    .replace(/\s*[?!.,;:…]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
