import { describe, expect, it } from "vitest";

import { inflateRect } from "@/features/jarvis/model/inflateRect";

describe("inflateRect", () => {
  const base = { top: 100, left: 200, width: 50, height: 40 };

  it("pad uniforme", () => {
    expect(inflateRect(base, 10)).toEqual({
      top: 90,
      left: 190,
      width: 70,
      height: 60,
    });
  });

  it("pads H/V séparés", () => {
    expect(inflateRect(base, { x: 80, y: 48 })).toEqual({
      top: 52,
      left: 120,
      width: 210,
      height: 136,
    });
  });
});
