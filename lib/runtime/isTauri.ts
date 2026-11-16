/**
 * Détection shell Tauri v2.
 * Aligné sur `@tauri-apps/api/core` (`window.isTauri`) + fallback internals.
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const w = window as Window & {
    isTauri?: boolean;
    __TAURI_INTERNALS__?: unknown;
  };
  if (w.isTauri === true) {
    return true;
  }
  return (
    typeof w.__TAURI_INTERNALS__ === "object" && w.__TAURI_INTERNALS__ !== null
  );
}
