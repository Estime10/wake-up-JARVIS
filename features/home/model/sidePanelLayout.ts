import gsap from "gsap";

/**
 * Le 75/25 vient du CSS d'AppShell (jamais animé) : le panneau n'entre
 * qu'en transform/opacity (ADR 0004).
 */

/** Panneau hors champ à droite — départ du handoff splash→home. */
export function setSidePanelOffscreen(aside: HTMLElement): void {
  gsap.set(aside, { xPercent: 100, opacity: 0.35 });
}

/** Panneau en place (styles inline retirés). */
export function setSidePanelOpen(aside: HTMLElement): void {
  gsap.set(aside, { clearProps: "transform,opacity" });
}
