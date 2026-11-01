import gsap from "gsap";

/** Prépare un path/circle SVG pour un dessin `strokeDashoffset` (0 → visible). */
export function prepareDrawStroke(el: SVGGeometryElement): number {
  const length = el.getTotalLength();
  gsap.set(el, {
    strokeDasharray: length,
    strokeDashoffset: length,
    opacity: 1,
  });
  return length;
}
