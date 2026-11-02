import { describe, expect, it } from "vitest";

import { formatPayloadDisplay } from "@/lib/actions/formatPayloadDisplay";

describe("formatPayloadDisplay", () => {
  it("signale U+202E, U+200B, U+007F, U+0085 (CRASH TEST)", () => {
    const raw = `x\u202E\u200B\u007F\u0085y`;
    const segments = formatPayloadDisplay(raw);
    const labels = segments
      .filter((s) => s.kind === "codepoint")
      .map((s) => s.label);
    expect(labels).toEqual(["U+202E", "U+200B", "U+007F", "U+0085"]);
    expect(segments.some((s) => s.kind === "text" && s.value === "x")).toBe(
      true,
    );
    expect(segments.some((s) => s.kind === "text" && s.value === "y")).toBe(
      true,
    );
  });
});
