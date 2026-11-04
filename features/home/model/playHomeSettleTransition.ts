import gsap from "gsap";

import {
  HOME_CHROME_DURATION,
  MARK_ENTER_DURATION,
  MARK_ENTER_EASE,
} from "@/features/home/model/homeEnterTweens";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import {
  queryChrome,
  queryComposer,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";

type PlayHomeSettleTransitionArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement;
  reducedMotion: boolean;
  /**
   * Snapshot Flip pris AVANT le passage briefing → settling
   * (sinon mark + JARVIS sont déjà au layout home).
   */
  flipSnapshot: ReturnType<typeof Flip.getState> | null;
  onEnd: () => void;
};

/**
 * Settle après briefing :
 * 1) mark + JARVIS Flip vers slot home (+ side)
 * 2) puis input (+ chrome)
 */
export function playHomeSettleTransition({
  root,
  mark,
  aside,
  reducedMotion,
  flipSnapshot,
  onEnd,
}: PlayHomeSettleTransitionArgs): () => void {
  const wordmark = queryWordmark(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const homeSlot = queryMarkSlot(root, "home");

  if (reducedMotion || !homeSlot) {
    setSidePanelOpen(aside);
    if (mark && homeSlot) {
      placeOnRect(mark, homeSlot.getBoundingClientRect());
      showMark(mark);
    }
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      // Garder visible — clearProps ferait revenir un éventuel opacity-0 CSS.
      gsap.set(chrome, { opacity: 1 });
    }
    if (wordmark) {
      gsap.set(wordmark, { clearProps: "opacity,transform", opacity: 1, y: 0 });
    }
    onEnd();
    return () => {};
  }

  setSidePanelOffscreen(aside);

  if (composer) {
    gsap.set(composer, { opacity: 0, y: 36 });
  }
  if (chrome) {
    gsap.set(chrome, { opacity: 0 });
  }
  if (wordmark) {
    gsap.set(wordmark, { opacity: 1, y: 0 });
  }

  const tl = gsap.timeline({
    defaults: { ease: MARK_ENTER_EASE },
    onComplete: onEnd,
  });

  // 1) Mark + JARVIS : Flip depuis snapshot briefing → layout home
  if (mark) {
    placeOnRect(mark, homeSlot.getBoundingClientRect());
    showMark(mark);
  }

  if (flipSnapshot) {
    const targets: HTMLElement[] = [];
    if (mark) {
      targets.push(mark);
    }
    if (wordmark) {
      targets.push(wordmark);
    }
    tl.add(
      Flip.from(flipSnapshot, {
        targets,
        scale: true,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
      }),
      0,
    );
  }

  tl.to(
    aside,
    {
      xPercent: 0,
      opacity: 1,
      duration: MARK_ENTER_DURATION,
      ease: MARK_ENTER_EASE,
    },
    0,
  );

  // 2) Input (+ chrome) après mark/JARVIS/side
  const inputAt = MARK_ENTER_DURATION;
  if (composer) {
    tl.to(
      composer,
      {
        opacity: 1,
        y: 0,
        duration: HOME_CHROME_DURATION,
        ease: "power2.out",
      },
      inputAt,
    );
  }
  if (chrome) {
    tl.to(
      chrome,
      { opacity: 1, duration: HOME_CHROME_DURATION, ease: "power2.out" },
      inputAt,
    );
  }

  return () => {
    tl.kill();
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
    if (mark && homeSlot) {
      placeOnRect(mark, homeSlot.getBoundingClientRect());
      gsap.set(mark, { opacity: 1, x: 0, y: 0, scale: 1 });
    }
  };
}
