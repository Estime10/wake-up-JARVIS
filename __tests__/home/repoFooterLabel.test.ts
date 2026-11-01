import { describe, expect, it } from "vitest";

import { repoFooterLabel } from "@/features/home/model/repoFooterLabel";

describe("repoFooterLabel", () => {
  it("varie selon le scénario", () => {
    expect(repoFooterLabel("nominal")).toContain("synchronisé");
    expect(repoFooterLabel("offline")).toContain("cache");
    expect(repoFooterLabel("disconnected")).toContain("GitHub");
    expect(repoFooterLabel("denied")).toContain("GitHub");
  });
});
