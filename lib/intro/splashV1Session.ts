const KEY = "jarvis.splashV1Done";

/** Survive Strict Mode remount (useState init 2× ne doit pas perdre le flag). */
let memoryDone = false;

/** Marque la fin du splash (session) — home ne rejoue pas l’overlay. */
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

/** Splash déjà joué cette session ? (sans consommer le flag). */
export function hasSplashV1PlayedThisSession(): boolean {
  if (memoryDone) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * @deprecated Préférer `hasSplashV1PlayedThisSession` + `markSplashV1Done`.
 * Conservé pour compat lecture one-shot.
 */
export function consumeSplashV1Done(): boolean {
  if (!hasSplashV1PlayedThisSession()) {
    return false;
  }
  memoryDone = true;
  return true;
}
