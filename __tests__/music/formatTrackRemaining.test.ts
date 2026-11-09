import { describe, expect, it } from "vitest";

import { formatTrackRemaining } from "@/features/music/model/formatTrackRemaining";

describe("formatTrackRemaining", () => {
  it("préfixe un tiret", () => {
    expect(formatTrackRemaining(42)).toBe("-0:42");
  });
});
