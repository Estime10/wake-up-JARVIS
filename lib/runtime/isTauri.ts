/**
 * Détection shell Tauri v2 (WebView).
 * Les invokes (`@tauri-apps/api`) ne doivent tourner que si vrai.
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}
