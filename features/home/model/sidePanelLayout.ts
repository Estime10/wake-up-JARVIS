import gsap from "gsap";

/**
 * Le 75/25 vient du CSS d'AppShell (jamais animé) : le panneau n'entre
 * qu'en transform/opacity (ADR 0004).
 * Étape 1 refonte-ui : sidebar commentée — no-op si aside absent.
 */

/** Panneau hors champ à droite — départ du handoff splash→home. */
export function setSidePanelOffscreen(aside: HTMLElement | null): void {
  if (!aside) {
    return;
  }
  gsap.set(aside, { xPercent: 100, opacity: 0.35 });
}

/** Panneau en place (styles inline retirés). */
export function setSidePanelOpen(aside: HTMLElement | null): void {
  if (!aside) {
    return;
  }
  gsap.set(aside, { clearProps: "transform,opacity" });
}
