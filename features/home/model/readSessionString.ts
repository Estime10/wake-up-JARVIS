/**
 * Lit une string depuis sessionStorage, ou null si absent / indisponible / SSR.
 */
export function readSessionString(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
