import gsap from "gsap";

import {
  appendHomeChromeWave,
  MARK_ENTER_DURATION,
  MARK_ENTER_EASE,
  prepareBrandTextsHidden,
  prepareChromeHidden,
  prepareComposerHidden,
} from "@/features/home/model/homeEnterTweens";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import {
  isElement,
  queryChrome,
  queryComposer,
  queryGreeting,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";

type PlayHomeEnterTransitionArgs = {
  /** Scope des requêtes (coquille home). */
  root: HTMLElement;
  /** Mark persistant (ref JarvisShell). */
  mark: HTMLElement | null;
  aside: HTMLElement;
  snapshot: SplashEnterSnapshot;
  reducedMotion: boolean;
  /** Fin réelle de l'enter (libère le handoff). */
  onEnd: () => void;
};

/**
 * 1) Flip mark splash → slot home (scale-down).
 * 2) Au landing : chrome + textes + composer + panneau — tous ensemble.
 */
export function playHomeEnterTransition({
  root,
  mark,
  aside,
  snapshot,
  reducedMotion,
  onEnd,
}: PlayHomeEnterTransitionArgs): () => void {
  const slot = queryMarkSlot(root, "home");
  const wordmark = queryWordmark(root);
  const greeting = queryGreeting(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const texts = [wordmark, greeting].filter(isElement);

  setSidePanelOpen(aside);

  if (mark && slot) {
    placeOnRect(mark, slot.getBoundingClientRect());
    showMark(mark);
  }

  if (reducedMotion || !slot) {
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      gsap.set(chrome, { clearProps: "opacity" });
    }
    if (texts.length > 0) {
      gsap.set(texts, { clearProps: "opacity,transform" });
    }
    onEnd();
    return () => {};
  }

  prepareComposerHidden(composer);
  prepareBrandTextsHidden(texts);
  prepareChromeHidden(chrome);

  const tl = gsap.timeline({
    defaults: { ease: MARK_ENTER_EASE },
    onComplete: onEnd,
  });

  // Flip mesure l'état final (panneau ouvert), puis on décale le panneau.
  if (mark) {
    tl.add(
      Flip.from(snapshot, {
        targets: [mark],
        scale: true,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
      }),
      0,
    );
  }

  setSidePanelOffscreen(aside);

  appendHomeChromeWave(tl, {
    at: MARK_ENTER_DURATION,
    aside,
    chrome,
    texts,
    composer,
  });

  return () => {
    tl.kill();
    setSidePanelOpen(aside);
    if (texts.length > 0) {
      gsap.set(texts, { clearProps: "transform", opacity: 1 });
    }
    if (composer) {
      gsap.set(composer, { clearProps: "transform", opacity: 1, y: 0 });
    }
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
    if (mark) {
      gsap.set(mark, { x: 0, y: 0, scale: 1 });
    }
  };
}
