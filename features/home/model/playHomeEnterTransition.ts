import gsap from "gsap";

import {
  setSidePanelClosed,
  setSidePanelOpen,
  SIDE_PANEL_OPEN_COLUMNS,
} from "@/features/home/model/sidePanelLayout";
import {
  pinToBounds,
  placeOnRect,
  releasePinned,
  tweenToBounds,
} from "@/features/jarvis/model/enterBoundsMotion";
import {
  endHomeEnterSession,
  type SplashEnterSnapshot,
} from "@/features/jarvis/model/homeEnterHandoff";
import {
  queryComposer,
  queryGreeting,
  queryMark,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";

const DURATION = 1.2;
const EASE = "power3.inOut";

type PlayHomeEnterTransitionArgs = {
  shell: HTMLElement;
  aside: HTMLElement;
  snapshot: SplashEnterSnapshot;
  reducedMotion: boolean;
};

/**
 * Timeline unique : mark scale-down + panneau + textes + composer.
 * Le mark part TOUJOURS des bounds splash capturés (scale explicite).
 */
export function playHomeEnterTransition({
  shell,
  aside,
  snapshot,
  reducedMotion,
}: PlayHomeEnterTransitionArgs): () => void {
  const mark = queryMark();
  const slot = queryMarkSlot("home");
  const wordmark = queryWordmark();
  const greeting = queryGreeting();
  const composer = queryComposer();

  if (reducedMotion || !slot) {
    setSidePanelOpen(shell, aside);
    if (mark && slot) {
      placeOnRect(mark, slot.getBoundingClientRect());
      gsap.set(mark, { opacity: 1 });
    }
    endHomeEnterSession();
    return () => {};
  }

  // Mesure finale (layout home ouvert).
  setSidePanelOpen(shell, aside);
  const markTo = slot.getBoundingClientRect();
  const wordmarkTo = wordmark?.getBoundingClientRect() ?? null;
  const greetingTo = greeting?.getBoundingClientRect() ?? null;

  // État départ : plein écran, panneau hors champ.
  setSidePanelClosed(shell, aside);
  gsap.set(aside, { opacity: 0.35 });

  if (mark && snapshot.mark) {
    pinToBounds(mark, snapshot.mark, 60);
    gsap.set(mark, { opacity: 1 });
  } else if (mark) {
    gsap.set(mark, { opacity: 1, zIndex: 60 });
  }

  if (wordmark && snapshot.wordmark) {
    pinToBounds(wordmark, snapshot.wordmark, 55);
  }
  if (greeting && snapshot.greeting) {
    pinToBounds(greeting, snapshot.greeting, 55);
  }
  if (composer) {
    gsap.set(composer, { opacity: 0, y: 40 });
  }

  const pinned = [wordmark, greeting].filter(Boolean) as HTMLElement[];

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    onComplete: () => {
      releasePinned(pinned);
      endHomeEnterSession();
    },
  });

  tl.to(
    shell,
    { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS, duration: DURATION },
    0,
  );
  tl.to(aside, { xPercent: 0, opacity: 1, duration: DURATION }, 0);

  if (mark) {
    tweenToBounds(tl, mark, markTo, DURATION);
  }
  if (wordmark && wordmarkTo && snapshot.wordmark) {
    tweenToBounds(tl, wordmark, wordmarkTo, DURATION);
  }
  if (greeting && greetingTo && snapshot.greeting) {
    tweenToBounds(tl, greeting, greetingTo, DURATION);
  }

  if (composer) {
    tl.to(
      composer,
      { opacity: 1, y: 0, duration: 0.95, ease: "power2.out" },
      0.22,
    );
  }

  return () => {
    // Kill sans endHomeEnterSession : pending survit → remount peut rejouer.
    tl.kill();
    releasePinned(pinned);
  };
}
