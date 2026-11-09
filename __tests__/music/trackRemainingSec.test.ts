import { describe, expect, it } from "vitest";

import { trackRemainingSec } from "@/features/music/model/trackRemainingSec";

describe("trackRemainingSec", () => {
  it("calcule le reste", () => {
    expect(
      trackRemainingSec({
        positionSec: 97,
        durationSec: 257,
        playing: true,
      }),
    ).toBe(160);
  });

  it("ne descend pas sous zéro", () => {
    expect(
      trackRemainingSec({
        positionSec: 300,
        durationSec: 257,
        playing: false,
      }),
    ).toBe(0);
  });
});
