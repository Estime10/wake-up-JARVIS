export type InflatedRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type InflatePads = {
  x: number;
  y: number;
};

/** Agrandit un rect — pads H/V séparés (modale plus large que haute). */
export function inflateRect(
  rect: Pick<DOMRectReadOnly, "top" | "left" | "width" | "height">,
  pad: number | InflatePads,
): InflatedRect {
  const x = typeof pad === "number" ? pad : pad.x;
  const y = typeof pad === "number" ? pad : pad.y;
  return {
    top: rect.top - y,
    left: rect.left - x,
    width: rect.width + x * 2,
    height: rect.height + y * 2,
  };
}
