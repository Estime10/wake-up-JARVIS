import gsap from "gsap";

type TweenTimeline = {
  to: (
    target: gsap.TweenTarget,
    vars: object,
    position?: number | string,
  ) => unknown;
};

/** Durée Flip mark splash → slot home. */
export const MARK_ENTER_DURATION = 1.2;
export const MARK_ENTER_EASE = "power3.inOut";

/** Vague UI après landing du mark (chrome + textes + input + panneau). */
export const HOME_CHROME_DURATION = 0.75;
export const HOME_CHROME_EASE = "power2.out";

/** État initial composer — avant la timeline (handoff + entrée directe). */
export function prepareComposerHidden(composer: HTMLElement | null): void {
  if (!composer) {
    return;
  }
  gsap.set(composer, { opacity: 0, y: 40 });
}

/** Textes brand (wordmark / greeting) cachés avant révélation home. */
export function prepareBrandTextsHidden(texts: HTMLElement[]): void {
  if (texts.length === 0) {
    return;
  }
  gsap.set(texts, { opacity: 0, y: 14 });
}

/** Chrome HUD caché avant révélation home. */
export function prepareChromeHidden(chrome: HTMLElement | null): void {
  if (!chrome) {
    return;
  }
  gsap.set(chrome, { opacity: 0 });
}

/**
 * Après le landing du mark : équerres / méta, textes, composer, panneau —
 * tous ensemble au même `at`.
 */
export function appendHomeChromeWave(
  tl: TweenTimeline,
  args: {
    at: number;
    aside: HTMLElement;
    chrome: HTMLElement | null;
    texts: HTMLElement[];
    composer: HTMLElement | null;
  },
): void {
  const { at, aside, chrome, texts, composer } = args;
  const duration = HOME_CHROME_DURATION;
  const ease = HOME_CHROME_EASE;

  tl.to(aside, { xPercent: 0, opacity: 1, duration, ease }, at);

  if (chrome) {
    tl.to(chrome, { opacity: 1, duration, ease }, at);
  }

  if (texts.length > 0) {
    tl.to(
      texts,
      {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger: 0.05,
      },
      at,
    );
  }

  if (composer) {
    tl.to(composer, { opacity: 1, y: 0, duration, ease }, at);
  }
}
