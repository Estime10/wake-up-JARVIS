import gsap from "gsap";

import type { EnterBounds } from "@/features/jarvis/model/markDom";
import { toBounds } from "@/features/jarvis/model/markDom";
import type { GsapTimeline } from "@/lib/gsap/timelineType";

const PINNED_CLEAR_PROPS =
  "position,top,left,width,height,margin,zIndex,transform";

/** Pin fixed aux bounds écran (FLIP manuel). */
export function pinToBounds(
  el: HTMLElement,
  bounds: EnterBounds,
  zIndex: number,
): void {
  gsap.set(el, {
    position: "fixed",
    top: bounds.top,
    left: bounds.left,
    width: bounds.width,
    height: bounds.height,
    margin: 0,
    x: 0,
    y: 0,
    zIndex,
  });
}

/** Place un élément sur le rect courant d’un slot (sans toucher opacity). */
export function placeOnRect(el: HTMLElement, rect: DOMRectReadOnly): void {
  const bounds = toBounds(rect);
  gsap.set(el, {
    top: bounds.top,
    left: bounds.left,
    width: bounds.width,
    height: bounds.height,
  });
}

/** Tween bounds (top/left/width/height) sur la timeline. */
export function tweenToBounds(
  tl: GsapTimeline,
  el: HTMLElement,
  to: DOMRectReadOnly | EnterBounds,
  duration: number,
  position: number | string = 0,
): void {
  tl.to(
    el,
    {
      top: to.top,
      left: to.left,
      width: to.width,
      height: to.height,
      duration,
    },
    position,
  );
}

/** Libère les pins fixed → retour flux document. */
export function releasePinned(els: HTMLElement[]): void {
  if (els.length === 0) {
    return;
  }
  gsap.set(els, { clearProps: PINNED_CLEAR_PROPS });
}
