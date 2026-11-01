import gsap from "gsap";

import {
  setSidePanelOffscreen,
  setSidePanelOpen,
} from "@/features/home/model/sidePanelLayout";
import type { SplashEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import {
  isElement,
  queryComposer,
  queryGreeting,
  queryMarkSlot,
  queryWordmark,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { Flip } from "@/lib/gsap/flip";

const DURATION = 1.2;
const EASE = "power3.inOut";

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
 * Timeline unique : mark scale-down + panneau + textes + composer.
 * Layout final posé d'abord (grille 75/25 fixe), puis GSAP Flip (ADR 0004) :
 * mark et textes repartent de l'état splash (`data-flip-id`), en transform
 * seulement (`scale: true` → x/y/scale, jamais width/height).
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

  setSidePanelOpen(aside);

  if (mark && slot) {
    // Placement définitif hors contexte GSAP (jamais revert, cf. markPlacement).
    placeOnRect(mark, slot.getBoundingClientRect());
    showMark(mark);
  }

  if (reducedMotion || !slot) {
    onEnd();
    return () => {};
  }

  const targets = [mark, wordmark, greeting].filter(isElement);
  const texts = [wordmark, greeting].filter(isElement);

  const tl = gsap.timeline({
    defaults: { ease: EASE },
    onComplete: onEnd,
  });

  // Flip mesure l'état final maintenant (panneau encore ouvert), puis
  // seulement on décale le panneau (transform, sans effet sur la grille).
  tl.add(
    Flip.from(snapshot, {
      targets,
      scale: true,
      duration: DURATION,
      ease: EASE,
    }),
    0,
  );

  setSidePanelOffscreen(aside);
  tl.to(aside, { xPercent: 0, opacity: 1, duration: DURATION }, 0);

  if (composer) {
    tl.fromTo(
      composer,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.95, ease: "power2.out" },
      0.22,
    );
  }

  return () => {
    // Abort (kill sans onEnd : pending survit → un remount
    // rejoue). On repose l'état final pour ne rien laisser invisible/décalé.
    tl.kill();
    setSidePanelOpen(aside);
    gsap.set(texts, { clearProps: "transform" });
    if (composer) {
      gsap.set(composer, { clearProps: "opacity,transform" });
    }
    if (mark) {
      gsap.set(mark, { x: 0, y: 0, scale: 1 });
    }
  };
}
