import gsap from "gsap";

import {
  applyMarkClusterFromPose,
  type MarkClusterFromPose,
} from "@/features/home/model/markClusterFromPose";
import { queryMarkSlot } from "@/features/jarvis/model/markDom";
import { placeOnRect } from "@/features/jarvis/model/markPlacement";

type SettleTimeline = ReturnType<typeof gsap.timeline>;

type PlayMarkClusterRiseArgs = {
  root: ParentNode;
  mark: HTMLElement;
  fromPose: MarkClusterFromPose;
  duration: number;
  ease: string;
  timeline: SettleTimeline;
  at?: number;
};

/**
 * Remontée + shrink via top/left/width/height vers le slot (layout déjà final).
 */
export function playMarkClusterRise({
  root,
  mark,
  fromPose,
  duration,
  ease,
  timeline,
  at = 0,
}: PlayMarkClusterRiseArgs): void {
  if (mark.dataset.markFlip !== "1") {
    applyMarkClusterFromPose(root, mark, fromPose);
  }

  const homeSlot = queryMarkSlot(root, "home");
  if (!homeSlot) {
    return;
  }

  const to = homeSlot.getBoundingClientRect();
  if (to.width < 8) {
    return;
  }

  // Cible figée au départ — pas de re-mesure en fin (évite micro-redescente).
  const target = {
    top: to.top,
    left: to.left,
    width: to.width,
    height: to.height,
  };

  timeline.to(
    mark,
    {
      top: target.top,
      left: target.left,
      width: target.width,
      height: target.height,
      duration,
      ease,
      onComplete: () => {
        placeOnRect(mark, target);
        gsap.set(mark, {
          x: 0,
          y: 0,
          scale: 1,
          xPercent: 0,
          yPercent: 0,
        });
      },
    },
    at,
  );
}
