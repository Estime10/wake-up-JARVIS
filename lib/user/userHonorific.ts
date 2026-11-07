/** « bosse » = graphie demandée (équivalent boss). */
const HONORIFICS = ["patron", "bosse"] as const;

export type UserHonorific = (typeof HONORIFICS)[number];

/** Apostrophe aléatoire — patron ou boss (adresse vocale). */
export function pickUserHonorific(): UserHonorific {
  const index = Math.floor(Math.random() * HONORIFICS.length);
  return HONORIFICS[index] ?? "patron";
}

/**
 * Remplace « DevinChat » par un honorifique tiré une fois pour toute la phrase.
 */
export function withUserHonorific(text: string): string {
  if (!/\bDevinChat\b/.test(text)) {
    return text;
  }
  const alias = pickUserHonorific();
  return text.replace(/\bDevinChat\b/g, alias);
}
