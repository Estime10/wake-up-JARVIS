import { describe, expect, it } from "vitest";

import { resolveSupabaseProjectQuery } from "@/features/assistant/model/resolveSupabaseProjectQuery";

const entries = [
  { name: "KING_OF_THE_COURT", ref: "aaa" },
  { name: "JARVIS", ref: "bbb" },
] as const;

describe("resolveSupabaseProjectQuery", () => {
  it("résout par index (liste Studio)", () => {
    expect(resolveSupabaseProjectQuery("2", entries)?.name).toBe("JARVIS");
    expect(resolveSupabaseProjectQuery("2.", entries)?.name).toBe("JARVIS");
    expect(resolveSupabaseProjectQuery("2. JARVIS", entries)?.name).toBe(
      "JARVIS",
    );
    expect(
      resolveSupabaseProjectQuery("1. KING_OF_THE_COURT", entries)?.name,
    ).toBe("KING_OF_THE_COURT");
  });

  it("résout par nom / ref", () => {
    expect(resolveSupabaseProjectQuery("JARVIS", entries)?.ref).toBe("bbb");
    expect(resolveSupabaseProjectQuery("bbb", entries)?.name).toBe("JARVIS");
  });

  it("rejette un index hors liste", () => {
    expect(resolveSupabaseProjectQuery("9", entries)).toBeNull();
  });
});
