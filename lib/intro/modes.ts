/** Modes d'intro (préférences). `null` = pas encore connu côté client. */
export type IntroMode = "full" | "short" | "none";

export type IntroModeState = IntroMode | null;

export function isPlayableIntroMode(mode: IntroModeState): mode is IntroMode {
  return mode === "full" || mode === "short";
}
