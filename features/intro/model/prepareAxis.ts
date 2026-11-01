import gsap from "gsap";

/**
 * Axe CAL / ligne / AZ — part du haut du cercle (invisible).
 * `y` relatif au centre (conteneur déjà en `top-1/2`).
 */
export function prepareAxis(axis: HTMLElement, mark: HTMLElement): void {
  const offsetY = -(mark.offsetHeight / 2);
  gsap.set(axis, { opacity: 0, y: offsetY });
}
