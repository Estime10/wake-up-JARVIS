type LayoutRect = Pick<DOMRectReadOnly, "top" | "left" | "width" | "height">;

/**
 * Pose de layout du mark (pas une animation) : écrite en style inline, hors
 * GSAP. Aucun `gsap.context` / `matchMedia` ne l'enregistre, donc aucun revert
 * (ex. bascule reduced-motion après l'entrée) ne peut la défaire.
 */
export function placeOnRect(el: HTMLElement, rect: LayoutRect): void {
  const { style } = el;
  style.top = `${rect.top}px`;
  style.left = `${rect.left}px`;
  style.width = `${rect.width}px`;
  style.height = `${rect.height}px`;
}

/** Mark visible une fois posé (même garantie hors contexte que le layout). */
export function showMark(el: HTMLElement): void {
  el.style.opacity = "1";
}
