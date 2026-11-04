import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";
import { sanitizeCapturedToken } from "@/features/assistant/model/matchIntentPatterns";

/** Captures bornées — pas de `(.+)` gourmand adjacent (anti-ReDoS). */
const SLOT_CAPTURE: Record<string, string> = {
  label: "(\\S+(?:\\s+\\S+){0,12})",
  repo: "([A-Za-z0-9_.-]+(?:\\/[A-Za-z0-9_.-]+)?)",
  /** Nom de projet Supabase (espaces autorisés). */
  project: "(\\S+(?:\\s+\\S+){0,12})",
  folder: "(\\S+(?:\\s+\\S+){0,12})",
  file: "(\\S+(?:\\s+\\S+){0,8})",
  n: "(\\d{1,6})",
};

const SLOT_RE = /\{(label|repo|project|folder|file|n)\}/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countPhraseSlots(phrase: string): number {
  const normalized = normalizeIntentText(phrase);
  return (normalized.match(SLOT_RE) ?? []).length;
}

/**
 * Phrase d’exemple → regex ancrée, slots `{label}` etc. en captures nommées d’ordre.
 */
export function phraseToRegExp(phrase: string): RegExp {
  const normalized = normalizeIntentText(phrase);
  const parts: string[] = [];
  const slotRe = /\{(label|repo|project|folder|file|n)\}/g;
  let lastIndex = 0;
  let match = slotRe.exec(normalized);
  while (match) {
    parts.push(escapeRegExp(normalized.slice(lastIndex, match.index)));
    const slot = match[1]!;
    parts.push(SLOT_CAPTURE[slot] ?? "(\\S+)");
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
 * Ignore les phrases à plus de 2 slots (ReDoS).
 */
export function matchPhraseCatalog(
  text: string,
  phrases: readonly string[],
): PhraseMatch | null {
  const normalized = normalizeIntentText(text);
  if (normalized.length === 0 || normalized.length > 300) {
    return null;
  }

  for (const phrase of phrases) {
    if (countPhraseSlots(phrase) > 2) {
      continue;
    }
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
