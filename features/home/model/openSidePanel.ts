import gsap from "gsap";

import {
  setSidePanelClosed,
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

const OPEN_DURATION = 0.75;

/**
 * Ouvre le panneau droit en slide (domaine motion home).
 * Pas de React ici.
 */
export function openSidePanel({
  shell,
  aside,
  reducedMotion,
}: OpenSidePanelArgs): void {
  if (reducedMotion) {
    setSidePanelOpen(shell, aside);
    return;
  }

  setSidePanelClosed(shell, aside);

  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  tl.to(
    shell,
    { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS, duration: OPEN_DURATION },
    0,
  );
  tl.to(aside, { xPercent: 0, duration: OPEN_DURATION }, 0);
}
