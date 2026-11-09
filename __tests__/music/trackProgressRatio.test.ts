import { describe, expect, it } from "vitest";

import { trackProgressRatio } from "@/features/music/model/trackProgressRatio";

describe("trackProgressRatio", () => {
  it("renvoie un ratio borné", () => {
    expect(
      trackProgressRatio({
        positionSec: 50,
        durationSec: 100,
        playing: true,
      }),
    ).toBe(0.5);
  });

  it("durée nulle → 0", () => {
    expect(
      trackProgressRatio({
        positionSec: 10,
        durationSec: 0,
        playing: true,
      }),
    ).toBe(0);
  });
});
