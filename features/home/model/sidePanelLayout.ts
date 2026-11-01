import gsap from "gsap";

export const SIDE_PANEL_OPEN_COLUMNS = "minmax(0,75%) minmax(0,25%)";
export const SIDE_PANEL_CLOSED_COLUMNS = "minmax(0,100%) minmax(0,0%)";

/** Panneau fermé (plein écran main). */
export function setSidePanelClosed(
  shell: HTMLElement,
  aside: HTMLElement,
): void {
  gsap.set(shell, { gridTemplateColumns: SIDE_PANEL_CLOSED_COLUMNS });
  gsap.set(aside, { xPercent: 100 });
}

/** Panneau ouvert (75/25), aside en place. */
export function setSidePanelOpen(shell: HTMLElement, aside: HTMLElement): void {
  gsap.set(shell, { gridTemplateColumns: SIDE_PANEL_OPEN_COLUMNS });
  gsap.set(aside, { xPercent: 0, clearProps: "transform" });
}
