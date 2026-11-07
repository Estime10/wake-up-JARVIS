/**
 * Lit un nombre depuis sessionStorage, ou null si absent / invalide / SSR.
 */
export function readSessionNumber(key: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
