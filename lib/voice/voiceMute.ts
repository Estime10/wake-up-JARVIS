const MUTE_KEY = "elsa.voiceMuted.v1";

/** Voix coupée (répond en texte seulement). */
export function isVoiceMuted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setVoiceMuted(muted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (muted) {
      window.localStorage.setItem(MUTE_KEY, "1");
    } else {
      window.localStorage.removeItem(MUTE_KEY);
    }
  } catch {
    /* private mode */
  }
}
