import gsap from "gsap";

import {
  prepareChromeHidden,
  prepareComposerHidden,
} from "@/features/home/model/homeEnterTweens";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import { WORDMARK_REVEAL_SECONDS } from "@/lib/intro/timings";
import {
  queryChrome,
  queryComposer,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";

type PlayHomeBriefingHoldArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement;
  reducedMotion: boolean;
  fromSplash: boolean;
  onReady: () => void;
};

/**
 * Briefing : mark sur slot splash, puis révélation JARVIS, puis onReady (TTS).
 */
export function playHomeBriefingHold({
  root,
  mark,
  aside,
  reducedMotion,
  fromSplash,
  onReady,
}: PlayHomeBriefingHoldArgs): () => void {
  const wordmark = queryWordmark(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const briefingSlot =
    queryMarkSlot(root, "splash") ?? queryMarkSlot(root, "home");

  if (!reducedMotion) {
    setSidePanelOffscreen(aside);
  } else {
    setSidePanelOpen(aside);
  }

  prepareComposerHidden(composer);
  prepareChromeHidden(chrome);

  if (wordmark) {
    gsap.set(wordmark, { opacity: 0, y: 16 });
  }

  const placeOnBriefingSlot = (): void => {
    if (!mark || !briefingSlot) {
      return;
    }
    placeOnRect(mark, briefingSlot.getBoundingClientRect());
    showMark(mark);
    gsap.set(mark, {
      clearProps: "transform",
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    });
  };

  let revealTween: gsap.core.Tween | null = null;

  const revealWordmarkThenReady = (): void => {
    if (!wordmark) {
      onReady();
      return;
    }
    if (reducedMotion) {
      gsap.set(wordmark, { opacity: 1, y: 0 });
      onReady();
      return;
    }
    revealTween = gsap.to(wordmark, {
      opacity: 1,
      y: 0,
      duration: WORDMARK_REVEAL_SECONDS,
      ease: "power2.out",
      onComplete: onReady,
    });
  };

  const cleanup = (): void => {
    revealTween?.kill();
    setSidePanelOpen(aside);
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
    if (wordmark) {
      gsap.set(wordmark, { clearProps: "opacity,transform", opacity: 1, y: 0 });
    }
  };

  if (reducedMotion) {
    placeOnBriefingSlot();
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      gsap.set(chrome, { clearProps: "opacity" });
    }
    setSidePanelOpen(aside);
    revealWordmarkThenReady();
    return cleanup;
  }

  if (mark && briefingSlot && fromSplash) {
    const snapshot = Flip.getState(mark);
    placeOnRect(mark, briefingSlot.getBoundingClientRect());
    showMark(mark);
    const flip = Flip.from(snapshot, {
      targets: [mark],
      scale: true,
      duration: 0.55,
      ease: "power2.out",
      onComplete: revealWordmarkThenReady,
    });
    return () => {
      flip.kill();
      cleanup();
    };
  }

  placeOnBriefingSlot();
  revealWordmarkThenReady();

  return cleanup;
}
