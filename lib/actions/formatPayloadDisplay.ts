export type PayloadSegment =
  | { kind: "text"; value: string }
  | { kind: "codepoint"; value: string; label: string };

/**
 * Découpe le JCS pour l'UI : contrôles / non-ASCII → cases `U+XXXX`.
 * (Cc, Cf, et hors ASCII dans le payload affiché.)
 */
export function formatPayloadDisplay(raw: string): PayloadSegment[] {
  const segments: PayloadSegment[] = [];
  let buffer = "";

  function flushText(): void {
    if (buffer.length > 0) {
      segments.push({ kind: "text", value: buffer });
      buffer = "";
    }
  }

  for (const char of raw) {
    const code = char.codePointAt(0) ?? 0;
    const isControl =
      (code >= 0x00 && code <= 0x1f) ||
      code === 0x7f ||
      (code >= 0x80 && code <= 0x9f);
    const isFormat =
      code === 0x200b || code === 0x200c || code === 0x200d || code === 0x202e;
    const isNonAscii = code > 0x7f;

    if (isControl || isFormat || isNonAscii) {
      flushText();
      const label = `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
      segments.push({ kind: "codepoint", value: char, label });
    } else {
      buffer += char;
    }
  }
  flushText();
  return segments;
}
