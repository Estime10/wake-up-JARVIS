import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";
import { sanitizeCapturedToken } from "@/features/assistant/model/matchIntentPatterns";

const SLOT_CAPTURE: Record<string, string> = {
  label: "(.+)",
  repo: "([A-Za-z0-9_.-]+(?:\\/[A-Za-z0-9_.-]+)?)",
  folder: "(.+)",
  file: "(.+)",
  n: "(\\d+)",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Phrase d’exemple → regex ancrée, slots `{label}` etc. en captures nommées d’ordre.
 */
export function phraseToRegExp(phrase: string): RegExp {
  const normalized = normalizeIntentText(phrase);
  const parts: string[] = [];
  const slotRe = /\{(label|repo|folder|file|n)\}/g;
  let lastIndex = 0;
  let match = slotRe.exec(normalized);
  while (match) {
    parts.push(escapeRegExp(normalized.slice(lastIndex, match.index)));
    const slot = match[1]!;
    parts.push(SLOT_CAPTURE[slot] ?? "(.+)");
    lastIndex = match.index + match[0].length;
    match = slotRe.exec(normalized);
  }
  parts.push(escapeRegExp(normalized.slice(lastIndex)));
  return new RegExp(`^${parts.join("")}$`, "i");
}

export type PhraseMatch = {
  phrase: string;
  /** Captures dans l’ordre des slots de la phrase. */
  captures: string[];
};

/**
 * Premier match sur un catalogue de phrases (après normalisation).
 */
export function matchPhraseCatalog(
  text: string,
  phrases: readonly string[],
): PhraseMatch | null {
  const normalized = normalizeIntentText(text);
  if (normalized.length === 0) {
    return null;
  }

  for (const phrase of phrases) {
    const pattern = phraseToRegExp(phrase);
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }
    const captures = match
      .slice(1)
      .map((raw) => sanitizeCapturedToken(raw ?? "") ?? "")
      .filter((value) => value.length > 0);
    return { phrase, captures };
  }
  return null;
}

/** Raccourcis exacts (/, mots seuls) — match après normalisation. */
export function matchShortcuts(
  text: string,
  shortcuts: readonly string[],
): boolean {
  const normalized = normalizeIntentText(text);
  return shortcuts.some(
    (shortcut) => normalizeIntentText(shortcut) === normalized,
  );
}
