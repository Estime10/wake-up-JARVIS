/**
 * Normalise une saisie barre d’adresse → URL http(s) sûre, ou null.
 */
export function normalizeSideBrowserUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (/^(javascript|data|file|vbscript|blob):/i.test(trimmed)) {
    return null;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else if (!candidate.includes("://")) {
      candidate = `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    } else {
      return null;
    }
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
