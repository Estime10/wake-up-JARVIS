import { describe, expect, it } from "vitest";

import { formatTrackTime } from "@/features/music/model/formatTrackTime";

describe("formatTrackTime", () => {
  it("formate m:ss", () => {
    expect(formatTrackTime(0)).toBe("0:00");
    expect(formatTrackTime(97)).toBe("1:37");
    expect(formatTrackTime(257)).toBe("4:17");
  });

  it("borne les valeurs invalides", () => {
    expect(formatTrackTime(-12)).toBe("0:00");
    expect(formatTrackTime(Number.NaN)).toBe("0:00");
  });
});
