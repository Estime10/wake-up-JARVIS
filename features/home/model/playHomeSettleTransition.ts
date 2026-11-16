import gsap from "gsap";

import {
  HOME_SIDE_ENTER_X,
  MARK_ENTER_DURATION,
  MARK_ENTER_EASE,
} from "@/features/home/model/homeEnterTweens";
import {
  clearMarkClusterFromPose,
  type MarkClusterFromPose,
} from "@/features/home/model/markClusterFromPose";
import { playMarkClusterRise } from "@/features/home/model/playMarkClusterRise";
import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import {
  queryChrome,
  queryComposer,
  queryMarkSlot,
  queryNowPlaying,
  querySideLeft,
  querySideRight,
  queryTopbar,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";

type SettleTimeline = ReturnType<typeof gsap.timeline>;

type PlayHomeSettleTransitionArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement | null;
  reducedMotion: boolean;
  fromPose?: MarkClusterFromPose | null;
  /** Fin de settle — unlock composer / phase ready. */
  onEnd: () => void;
};

function fadeInChrome(
  tl: SettleTimeline,
  {
    topbar,
    sideLeft,
    sideRight,
    nowPlaying,
    composer,
    chrome,
  }: {
    topbar: HTMLElement | null;
    sideLeft: HTMLElement | null;
    sideRight: HTMLElement | null;
    nowPlaying: HTMLElement | null;
    composer: HTMLElement | null;
    chrome: HTMLElement | null;
  },
): void {
  if (topbar) {
    tl.to(
      topbar,
      {
        opacity: 1,
        y: 0,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
        clearProps: "transform",
      },
      0,
    );
  }
  if (sideLeft) {
    tl.to(
      sideLeft,
      {
        opacity: 1,
        x: 0,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
        clearProps: "transform",
      },
      0,
    );
  }
  if (sideRight) {
    tl.to(
      sideRight,
      {
        opacity: 1,
        x: 0,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
        clearProps: "transform",
      },
      0,
    );
  }
  if (nowPlaying) {
    tl.to(
      nowPlaying,
      {
        opacity: 1,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
      },
      0,
    );
  }
  if (composer) {
    tl.to(
      composer,
      {
        opacity: 1,
        y: 0,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
      },
      0,
    );
  }
  if (chrome) {
    tl.to(
      chrome,
      {
        opacity: 1,
        duration: MARK_ENTER_DURATION,
        ease: MARK_ENTER_EASE,
      },
      0,
    );
  }
}

/**
 * Settle home : mark + header + sides G/D + musique + composer — tout en même temps.
 */
export function playHomeSettleTransition({
  root,
  mark,
  aside,
  reducedMotion,
  fromPose = null,
  onEnd,
}: PlayHomeSettleTransitionArgs): () => void {
  const wordmark = queryWordmark(root);
  const composer = queryComposer(root);
  const chrome = queryChrome(root);
  const homeSlot = queryMarkSlot(root, "home");
  const nowPlaying = queryNowPlaying(root);
  const topbar = queryTopbar(root);
  const sideLeft = querySideLeft(root);
  const sideRight = querySideRight(root);

  const revealUi = (): void => {
    if (nowPlaying) {
      gsap.set(nowPlaying, { clearProps: "opacity", opacity: 1 });
    }
    if (topbar) {
      gsap.set(topbar, { clearProps: "opacity,transform", opacity: 1, y: 0 });
    }
    if (sideLeft) {
      gsap.set(sideLeft, {
        clearProps: "opacity,transform",
        opacity: 1,
        x: 0,
      });
    }
    if (sideRight) {
      gsap.set(sideRight, {
        clearProps: "opacity,transform",
        opacity: 1,
        x: 0,
      });
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
  };

  if (reducedMotion || !homeSlot) {
    setSidePanelOpen(aside);
    if (mark && homeSlot) {
      delete mark.dataset.markFlip;
      placeOnRect(mark, homeSlot.getBoundingClientRect());
      showMark(mark);
    }
    revealUi();
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
  if (nowPlaying) {
    gsap.set(nowPlaying, { opacity: 0 });
  }
  if (topbar) {
    gsap.set(topbar, { opacity: 0, y: -28 });
  }
  if (sideLeft) {
    gsap.set(sideLeft, { opacity: 0, x: -HOME_SIDE_ENTER_X });
  }
  if (sideRight) {
    gsap.set(sideRight, { opacity: 0, x: HOME_SIDE_ENTER_X });
  }
  if (wordmark) {
    gsap.set(wordmark, { opacity: 1, y: 0 });
  }

  const tl = gsap.timeline({
    defaults: { ease: MARK_ENTER_EASE },
    onComplete: () => {
      if (mark) {
        // Déjà piné sur la cible figée par playMarkClusterRise — ne pas
        // re-mesurer ni dispatcher resize (redescente post-anim).
        gsap.set(mark, {
          x: 0,
          y: 0,
          scale: 1,
          xPercent: 0,
          yPercent: 0,
        });
        delete mark.dataset.markFlip;
      }
      clearMarkClusterFromPose();
      onEnd();
    },
  });

  const clustered = Boolean(mark && fromPose);

  if (clustered && mark && fromPose) {
    playMarkClusterRise({
      root,
      mark,
      fromPose,
      duration: MARK_ENTER_DURATION,
      ease: MARK_ENTER_EASE,
      timeline: tl,
      at: 0,
    });
  } else if (mark) {
    mark.dataset.markFlip = "1";
    placeOnRect(mark, homeSlot.getBoundingClientRect());
    showMark(mark);
  }

  fadeInChrome(tl, {
    topbar,
    sideLeft,
    sideRight,
    nowPlaying,
    composer,
    chrome,
  });

  return () => {
    tl.kill();
    if (mark) {
      delete mark.dataset.markFlip;
    }
    setSidePanelOpen(aside);
    revealUi();
    if (mark && homeSlot) {
      gsap.set(mark, {
        opacity: 1,
        clearProps: "x,y,scale,xPercent,yPercent,transform",
      });
      placeOnRect(mark, homeSlot.getBoundingClientRect());
    }
  };
}
