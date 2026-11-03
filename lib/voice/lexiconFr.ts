/**
 * Lexique FR pour TTS — remplacements littéraux (casse ignorée côté normalize).
 * Limite connue : « 3/10 » peut être lu comme une date (documenté, non bloquant).
 */
export const LEXICON_FR: ReadonlyArray<{ pattern: RegExp; replace: string }> = [
  { pattern: /\bPRs?\b/gi, replace: "pull request" },
  { pattern: /\bpull requests?\b/gi, replace: "pull request" },
  { pattern: /\bcommits?\b/gi, replace: "commit" },
  { pattern: /\brepos?\b/gi, replace: "dépôt" },
  { pattern: /\brepositories\b/gi, replace: "dépôts" },
  { pattern: /\bGitHub\b/gi, replace: "github" },
  { pattern: /\bJARVIS\b/gi, replace: "Jarvis" },
  { pattern: /\bGmail\b/gi, replace: "gmail" },
  { pattern: /\bPDF\b/gi, replace: "pédéef" },
  { pattern: /\bAPI\b/gi, replace: "a p i" },
  { pattern: /\bHTTP\b/gi, replace: "h t t p" },
  { pattern: /\bOK\b/g, replace: "ok" },
];

/** Plafond caractères lus à voix haute ; le reste reste à l’écran. */
export const TTS_MAX_CHARS = 1500;

export const TTS_TRUNCATION_SUFFIX = " La suite est affichée à l'écran.";
