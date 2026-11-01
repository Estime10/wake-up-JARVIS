import gsap from "gsap";

import {
  setSidePanelOpen,
  SIDE_PANEL_OPEN_COLUMNS,
} from "@/features/home/model/sidePanelLayout";

export {
  SIDE_PANEL_CLOSED_COLUMNS,
  SIDE_PANEL_OPEN_COLUMNS,
} from "@/features/home/model/sidePanelLayout";

type OpenSidePanelArgs = {
  shell: HTMLElement;
  aside: HTMLElement;
  reducedMotion: boolean;
};

/**
 * Pose le panneau ouvert sans anim — refresh / entrée directe.
 * (Le slide reste réservé au handoff splash→home.)
 */
export function openSidePanel({
  shell,
  aside,
  reducedMotion,
}: OpenSidePanelArgs): void {
  void reducedMotion;
  gsap.set(shell, { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS });
  setSidePanelOpen(shell, aside);
}
