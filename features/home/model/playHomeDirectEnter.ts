import gsap from "gsap";

import {
  appendHomeChromeWave,
  HOME_CHROME_DURATION,
  MARK_ENTER_DURATION,
  prepareBrandTextsHidden,
  prepareChromeHidden,
  prepareComposerHidden,
} from "@/features/home/model/homeEnterTweens";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import {
  isElement,
  queryChrome,
  queryComposer,
  queryGreeting,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect } from "@/features/jarvis/model/markPlacement";

const MARK_EASE = "power3.out";

type PlayHomeDirectEnterArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement;
  reducedMotion: boolean;
  onEnd: () => void;
};

/**
 * Entrée home sans snapshot Flip (refresh / URL directe).
 * Mark d'abord, puis vague chrome/textes/input ensemble.
 */
export function playHomeDirectEnter({
  root,
  mark,
  aside,
  reducedMotion,
  onEnd,
}: PlayHomeDirectEnterArgs): () => void {
  const wordmark = queryWordmark(root);
  const greeting = queryGreeting(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const texts = [wordmark, greeting].filter(isElement);

  if (!reducedMotion) {
    setSidePanelOffscreen(aside);
  } else {
    setSidePanelOpen(aside);
  }

  const slot = queryMarkSlot(root, "home");

  if (mark && slot) {
    placeOnRect(mark, slot.getBoundingClientRect());
    gsap.set(mark, { clearProps: "transform" });
    gsap.set(mark, { opacity: 0, x: 0, y: 0, scale: 1 });
  }

  if (reducedMotion || !slot) {
    setSidePanelOpen(aside);
    if (mark) {
      gsap.set(mark, { opacity: 1, x: 0, y: 0, scale: 1 });
    }
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    gsap.set(texts, { clearProps: "opacity,transform" });
    onEnd();
    return () => {};
  }

  prepareBrandTextsHidden(texts);
  prepareComposerHidden(composer);
  prepareChromeHidden(chrome);

  const tl = gsap.timeline({
    defaults: { ease: MARK_EASE },
    onComplete: onEnd,
  });

  if (mark && slot) {
    tl.call(
      () => {
        placeOnRect(mark, slot.getBoundingClientRect());
        gsap.set(mark, { x: 0, y: 0, scale: 1 });
      },
      undefined,
      0,
    );
    tl.to(
      mark,
      { opacity: 1, duration: MARK_ENTER_DURATION, ease: MARK_EASE },
      0,
    );
  }

  appendHomeChromeWave(tl, {
    at: MARK_ENTER_DURATION,
    aside,
    chrome,
    texts,
    composer,
  });

  // Garde une durée minimale cohérente si mark absent.
  if (!mark) {
    tl.to({}, { duration: HOME_CHROME_DURATION }, MARK_ENTER_DURATION);
  }

  return () => {
    tl.kill();
    setSidePanelOpen(aside);
    gsap.set(texts, { clearProps: "transform", opacity: 1 });
    if (composer) {
      gsap.set(composer, { clearProps: "transform", opacity: 1, y: 0 });
    }
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
    if (mark) {
      const home = queryMarkSlot(root, "home");
      if (home) {
        placeOnRect(mark, home.getBoundingClientRect());
      }
      gsap.set(mark, { opacity: 1, x: 0, y: 0, scale: 1 });
    }
  };
}
