/**
 * Snippet Gmail parfois HTML-encodé (`&#39;`, `&amp;`) — texte lisible UI.
 */
export function decodeMailSnippet(value: string): string {
  return value
    .replace(/&#(\d+);/g, (match, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCharCode(n) : match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCharCode(n) : match;
    })
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}
