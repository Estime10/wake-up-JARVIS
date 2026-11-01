import gsap from "gsap";

type TweenTimeline = {
  to: (
    target: HTMLElement,
    vars: object,
    position?: number | string,
  ) => unknown;
};

const COMPOSER_DURATION = 0.95;
const COMPOSER_EASE = "power2.out";
const COMPOSER_AT = 0.22;

const CHROME_DURATION = 0.75;
const CHROME_EASE = "power2.out";
const CHROME_AT = 0.45;

/** État initial composer — avant la timeline (handoff + entrée directe). */
export function prepareComposerHidden(composer: HTMLElement | null): void {
  if (!composer) {
    return;
  }
  gsap.set(composer, { opacity: 0, y: 40 });
}

/** Composer : monte depuis le bas. */
export function appendComposerEnter(
  tl: TweenTimeline,
  composer: HTMLElement | null,
): void {
  if (!composer) {
    return;
  }
  tl.to(
    composer,
    {
      opacity: 1,
      y: 0,
      duration: COMPOSER_DURATION,
      ease: COMPOSER_EASE,
    },
    COMPOSER_AT,
  );
}

/** HUD chrome : fade après le cœur de l’entrée (entrée directe). */
export function appendChromeEnter(
  tl: TweenTimeline,
  chrome: HTMLElement | null,
): void {
  if (!chrome) {
    return;
  }
  tl.to(
    chrome,
    { opacity: 1, duration: CHROME_DURATION, ease: CHROME_EASE },
    CHROME_AT,
  );
}
