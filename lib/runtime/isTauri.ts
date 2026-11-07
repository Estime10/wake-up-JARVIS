/**
 * Détection shell Tauri v2 (WebView).
 * Pas de dépendance `@tauri-apps/api` — le package arrive avec l’étape invoke.
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}
