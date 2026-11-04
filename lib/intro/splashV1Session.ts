const KEY = "jarvis.splashV1Done";

/** Survive Strict Mode remount (useState init 2× ne doit pas perdre le flag). */
let memoryDone = false;

/** Marque la fin du splash SVG v1 — home ne rejoue pas l’ancien briefing mark. */
export function markSplashV1Done(): void {
  memoryDone = true;
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* private mode */
  }
}

export function consumeSplashV1Done(): boolean {
  if (memoryDone) {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(KEY);
      } catch {
        /* private mode */
      }
    }
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (window.sessionStorage.getItem(KEY) !== "1") {
      return false;
    }
    window.sessionStorage.removeItem(KEY);
    memoryDone = true;
    return true;
  } catch {
    return false;
  }
}
