import {
  LEXICON_FR,
  TTS_MAX_CHARS,
  TTS_TRUNCATION_SUFFIX,
} from "@/lib/voice/lexiconFr";

function normalizeMoney(text: string): string {
  return text
    .replace(
      /(\d[\d\s]*)([.,])(\d{1,2})\s*€/g,
      (_full, euros: string, _sep: string, cents: string) => {
        const whole = euros.replace(/\s+/g, "");
        const cent = cents.padEnd(2, "0");
        if (cent === "00") {
          return `${whole} euros`;
        }
        return `${whole} euros ${cent}`;
      },
    )
    .replace(/(\d[\d\s]*)\s*€/g, (_full, euros: string) => {
      const whole = euros.replace(/\s+/g, "");
      return `${whole} euros`;
    });
}

function normalizeClock(text: string): string {
  return text.replace(
    /\b(\d{1,2})\s*[hH]\s*(\d{2})\b/g,
    (_full, hours: string, minutes: string) => {
      if (minutes === "00") {
        return `${hours} heures`;
      }
      return `${hours} heures ${minutes}`;
    },
  );
}

function normalizePrHash(text: string): string {
  return text
    .replace(
      /\bPR\s*#\s*(\d+)\b/gi,
      (_full, num: string) => `pull request numéro ${num}`,
    )
    .replace(/#(\d+)\b/g, (_full, num: string) => `numéro ${num}`);
}

function applyLexicon(text: string): string {
  let out = text;
  for (const entry of LEXICON_FR) {
    out = out.replace(entry.pattern, entry.replace);
  }
  return out;
}

function truncateForSpeech(text: string): string {
  if (text.length <= TTS_MAX_CHARS) {
    return text;
  }
  const budget = TTS_MAX_CHARS - TTS_TRUNCATION_SUFFIX.length;
  const slice = text.slice(0, Math.max(0, budget));
  const cut = slice.replace(/\s+\S*$/u, "").trimEnd();
  return `${cut}${TTS_TRUNCATION_SUFFIX}`;
}

/**
 * Prépare un texte FR pour Piper / TTS.
 * CA-A1 : prix, heures, PR #n.
 */
export function normalizeFr(text: string): string {
  let out = text.normalize("NFC").trim();
  if (out.length === 0) {
    return "";
  }
  out = normalizeMoney(out);
  out = normalizeClock(out);
  out = normalizePrHash(out);
  out = applyLexicon(out);
  out = out.replace(/\s+/g, " ").trim();
  return truncateForSpeech(out);
}
