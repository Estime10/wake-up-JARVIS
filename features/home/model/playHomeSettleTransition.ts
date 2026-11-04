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
  aside: HTMLElement | null;
  reducedMotion: boolean;
  /**
   * Snapshot Flip pris AVANT le passage briefing → settling
   * (sinon mark + JARVIS sont déjà au layout home).
   */
  flipSnapshot: ReturnType<typeof Flip.getState> | null;
  /**
   * Splash v1 : ne pas re-poser / Flip le mark (pose capture déjà correcte).
   * Une seule animation : révélation composer (+ chrome si besoin).
   */
  preserveMarkPose?: boolean;
  onEnd: () => void;
};

/**
 * Settle après briefing :
 * - legacy : mark Flip vers slot home, puis input
 * - splash v1 (`preserveMarkPose`) : mark inchangé, fade composer seulement
 */
export function playHomeSettleTransition({
  root,
  mark,
  aside,
  reducedMotion,
  flipSnapshot,
  preserveMarkPose = false,
  onEnd,
}: PlayHomeSettleTransitionArgs): () => void {
  const wordmark = queryWordmark(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const homeSlot = queryMarkSlot(root, "home");

  if (reducedMotion || (!homeSlot && !preserveMarkPose)) {
    setSidePanelOpen(aside);
    if (mark && homeSlot && !preserveMarkPose) {
      placeOnRect(mark, homeSlot.getBoundingClientRect());
      showMark(mark);
    }
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      gsap.set(chrome, { opacity: 1 });
    }
    if (wordmark) {
      gsap.set(wordmark, { clearProps: "opacity,transform", opacity: 1, y: 0 });
    }
    onEnd();
    return () => {};
  }

  if (preserveMarkPose) {
    setSidePanelOpen(aside);
  } else {
    setSidePanelOffscreen(aside);
  }

  if (composer) {
    gsap.set(composer, { opacity: 0, y: 36 });
  }
  if (chrome && !preserveMarkPose) {
    gsap.set(chrome, { opacity: 0 });
  }
  if (wordmark) {
    gsap.set(wordmark, { opacity: 1, y: 0 });
  }

  const tl = gsap.timeline({
    defaults: { ease: MARK_ENTER_EASE },
    onComplete: onEnd,
  });

  if (!preserveMarkPose) {
    // 1) Mark + JARVIS : Flip depuis snapshot briefing → layout home
    if (mark && homeSlot) {
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

    if (aside) {
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
    }
  }

  // Composer (+ chrome legacy) — seule anim post-splash.
  const inputAt = preserveMarkPose ? 0 : MARK_ENTER_DURATION;
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
  if (chrome && !preserveMarkPose) {
    tl.to(
      chrome,
      { opacity: 1, duration: HOME_CHROME_DURATION, ease: "power2.out" },
      inputAt,
    );
  }

  // Splash v1 : timeline peut n’avoir que le composer — garantir onComplete.
  if (preserveMarkPose && !composer) {
    onEnd();
    return () => {};
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
    if (mark && homeSlot && !preserveMarkPose) {
      placeOnRect(mark, homeSlot.getBoundingClientRect());
      gsap.set(mark, { opacity: 1, x: 0, y: 0, scale: 1 });
    }
  };
}
