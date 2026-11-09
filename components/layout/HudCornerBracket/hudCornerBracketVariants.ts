/** Orientation des équerres HUD — bordures en L. */

export const HUD_CORNER_CLASS = {
  tl: "border-t border-l",
  tr: "border-t border-r",
  bl: "border-b border-l",
  br: "border-r border-b",
} as const;

export type HudCorner = keyof typeof HUD_CORNER_CLASS;
