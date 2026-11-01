import gsap from "gsap";

export const SIDE_PANEL_OPEN_COLUMNS = "minmax(0,75%) minmax(0,25%)";
export const SIDE_PANEL_CLOSED_COLUMNS = "minmax(0,100%) minmax(0,0%)";

type OpenSidePanelArgs = {
  shell: HTMLElement;
  aside: HTMLElement;
  reducedMotion: boolean;
};

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
    gsap.set(shell, { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS });
    gsap.set(aside, { x: 0, clearProps: "transform" });
    return;
  }

  gsap.set(shell, { gridTemplateColumns: SIDE_PANEL_CLOSED_COLUMNS });
  gsap.set(aside, { xPercent: 100 });

  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  tl.to(
    shell,
    { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS, duration: 0.75 },
    0,
  );
  tl.to(aside, { xPercent: 0, duration: 0.75 }, 0);
}
