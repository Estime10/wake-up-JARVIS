import { describe, expect, it } from "vitest";

import { assertReadOnlyPatScopes } from "@/lib/github/assertReadOnlyPatScopes";

describe("assertReadOnlyPatScopes", () => {
  it("accepte fine-grained", () => {
    expect(assertReadOnlyPatScopes("github_pat_abc", "repo")).toBe(true);
  });

  it("refuse classic repo / write", () => {
    expect(assertReadOnlyPatScopes("ghp_classic", "repo")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "write:org")).toBe(false);
  });

  it("accepte classic read-only", () => {
    expect(assertReadOnlyPatScopes("ghp_classic", "read:user")).toBe(true);
  });
});
