import gsap from "gsap";

import {
  appendChromeEnter,
  appendComposerEnter,
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

const DURATION = 1.05;
const EASE = "power3.out";

type PlayHomeDirectEnterArgs = {
  root: HTMLElement;
  mark: HTMLElement | null;
  aside: HTMLElement;
  reducedMotion: boolean;
  onEnd: () => void;
};

/**
 * Entrée home sans snapshot Flip (refresh / URL directe).
 * Pose le mark APRÈS le panneau offscreen, puis fade opacity only (pas de x/scale).
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

  // Panneau hors champ d'abord (transform only) — puis mesure du slot stable.
  if (!reducedMotion) {
    setSidePanelOffscreen(aside);
  } else {
    setSidePanelOpen(aside);
  }

  const slot = queryMarkSlot(root, "home");

  if (mark && slot) {
    placeOnRect(mark, slot.getBoundingClientRect());
    // left/top via style — clear tout transform GSAP résiduel, puis fade only.
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
    onEnd();
    return () => {};
  }

  if (texts.length > 0) {
    gsap.set(texts, { opacity: 0, y: 18 });
  }
  prepareComposerHidden(composer);
  if (chrome) {
    gsap.set(chrome, { opacity: 0 });
  }

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    onComplete: onEnd,
  });

  // Re-pose au 1er tick : fonts / scrollbar peuvent encore décaler le slot.
  if (mark && slot) {
    tl.call(
      () => {
        placeOnRect(mark, slot.getBoundingClientRect());
        gsap.set(mark, { x: 0, y: 0, scale: 1 });
      },
      undefined,
      0,
    );
    tl.to(mark, { opacity: 1, duration: DURATION, ease: EASE }, 0);
  }

  if (texts.length > 0) {
    tl.to(
      texts,
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power2.out",
        stagger: 0.06,
      },
      0.1,
    );
  }

  tl.to(aside, { xPercent: 0, opacity: 1, duration: DURATION }, 0);
  appendComposerEnter(tl, composer);
  appendChromeEnter(tl, chrome);

  return () => {
    tl.kill();
    setSidePanelOpen(aside);
    gsap.set(texts, { clearProps: "opacity,transform" });
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (chrome) {
      gsap.set(chrome, { clearProps: "opacity" });
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
