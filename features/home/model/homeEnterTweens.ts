import gsap from "gsap";

/** Durée Flip mark splash → slot home. */
export const MARK_ENTER_DURATION = 1.2;
export const MARK_ENTER_EASE = "power3.inOut";

/** Vague UI après landing du mark (chrome + input + panneau). */
export const HOME_CHROME_DURATION = 0.75;

/** État initial composer — avant la timeline (handoff + entrée directe). */
export function prepareComposerHidden(composer: HTMLElement | null): void {
  if (!composer) {
    return;
  }
  gsap.set(composer, { opacity: 0, y: 40 });
}

/** Chrome HUD caché avant révélation home. */
export function prepareChromeHidden(chrome: HTMLElement | null): void {
  if (!chrome) {
    return;
  }
  gsap.set(chrome, { opacity: 0 });
}
