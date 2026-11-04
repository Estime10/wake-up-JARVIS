import gsap from "gsap";

import {
  prepareChromeHidden,
  prepareComposerHidden,
} from "@/features/home/model/homeEnterTweens";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import {
  queryChrome,
  queryComposer,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";
import { WORDMARK_REVEAL_SECONDS } from "@/lib/intro/timings";

type PlayHomeBriefingHoldArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement;
  reducedMotion: boolean;
  fromSplash: boolean;
  flipSnapshot?: SplashEnterSnapshot | null;
  skipCenteredBriefing?: boolean;
  onReady: () => void;
};

/**
 * Briefing home : Flip du même JarvisMark (dessin splash) → slot home.
 */
export function playHomeBriefingHold({
  root,
  mark,
  aside,
  reducedMotion,
  fromSplash,
  flipSnapshot = null,
  skipCenteredBriefing = false,
  onReady,
}: PlayHomeBriefingHoldArgs): () => void {
  const wordmark = queryWordmark(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const homeSlot = queryMarkSlot(root, "home");
  const briefingSlot = skipCenteredBriefing
    ? (homeSlot ?? queryMarkSlot(root, "splash"))
    : (queryMarkSlot(root, "splash") ?? homeSlot);

  if (!reducedMotion && !skipCenteredBriefing) {
    setSidePanelOffscreen(aside);
  } else {
    setSidePanelOpen(aside);
  }

  prepareComposerHidden(composer);
  if (skipCenteredBriefing) {
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
  } else {
    prepareChromeHidden(chrome);
  }

  if (wordmark) {
    gsap.set(wordmark, { opacity: 0, y: 16 });
  }

  const placeOnTargetSlot = (): void => {
    if (!mark || !briefingSlot) {
      return;
    }
    placeOnRect(mark, briefingSlot.getBoundingClientRect());
    showMark(mark);
    mark.style.visibility = "";
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

  // Splash v1 : même JarvisMark Flip → slot home.
  if (
    skipCenteredBriefing &&
    mark &&
    homeSlot &&
    fromSplash &&
    flipSnapshot &&
    !reducedMotion
  ) {
    placeOnRect(mark, homeSlot.getBoundingClientRect());
    showMark(mark);
    mark.style.visibility = "";
    const flip = Flip.from(flipSnapshot, {
      targets: [mark],
      scale: true,
      duration: 0.65,
      ease: "power2.inOut",
      onComplete: revealWordmarkThenReady,
    });
    return () => {
      flip.kill();
      cleanup();
    };
  }

  if (skipCenteredBriefing) {
    placeOnTargetSlot();
    revealWordmarkThenReady();
    return cleanup;
  }

  if (reducedMotion) {
    placeOnTargetSlot();
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
    const snapshot = flipSnapshot ?? Flip.getState(mark);
    placeOnRect(mark, briefingSlot.getBoundingClientRect());
    showMark(mark);
    mark.style.visibility = "";
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

  placeOnTargetSlot();
  revealWordmarkThenReady();

  return cleanup;
}
