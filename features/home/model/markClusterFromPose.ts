import gsap from "gsap";

import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { queryMarkSlot } from "@/features/jarvis/model/markDom";

export type MarkClusterFromPose = {
  mark: DOMRectReadOnly | null;
};

let pendingFromPose: MarkClusterFromPose | null = null;

/** Pose capturée juste avant `setPhase("settling")`. */
export function stashMarkClusterFromPose(pose: MarkClusterFromPose): void {
  pendingFromPose = pose;
}

export function peekMarkClusterFromPose(): MarkClusterFromPose | null {
  return pendingFromPose;
}

export function clearMarkClusterFromPose(): void {
  pendingFromPose = null;
}

/**
 * Pose le mark sur sa rect « from » (taille + position splash), avant paint.
 * L’anim settle tween ensuite top/left/width/height vers le slot.
 */
export function applyMarkClusterFromPose(
  root: ParentNode,
  mark: HTMLElement | null,
  pose: MarkClusterFromPose,
): void {
  const homeSlot = queryMarkSlot(root, "home");

  if (mark && homeSlot && pose.mark && pose.mark.width >= 8) {
    const toMark = homeSlot.getBoundingClientRect();
    if (toMark.width >= 8) {
      mark.dataset.markFlip = "1";
      placeOnRect(mark, pose.mark);
      showMark(mark);
      gsap.set(mark, {
        x: 0,
        y: 0,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        transformOrigin: "50% 50%",
      });
    }
  }
}
