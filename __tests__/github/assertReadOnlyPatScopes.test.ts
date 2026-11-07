import { describe, expect, it } from "vitest";

import {
  assertFineGrainedPatShape,
  assertReadOnlyPatScopes,
} from "@/lib/github/assertReadOnlyPatScopes";

describe("assertReadOnlyPatScopes", () => {
  it("refuse fine-grained si header scopes hors allowlist", () => {
    expect(assertReadOnlyPatScopes("github_pat_abc", "repo")).toBe(false);
    expect(assertReadOnlyPatScopes("github_pat_abc", "delete:packages")).toBe(
      false,
    );
  });

  it("accepte fine-grained sans scopes header (sonde /user ailleurs)", () => {
    expect(assertReadOnlyPatScopes("github_pat_abc", null)).toBe(true);
    expect(assertFineGrainedPatShape("github_pat_abc")).toBe(true);
  });

  it("refuse classic repo / write / user / security_events", () => {
    expect(assertReadOnlyPatScopes("ghp_classic", "repo")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "write:org")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "user")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "security_events")).toBe(
      false,
    );
    expect(assertReadOnlyPatScopes("ghp_classic", "codespace")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "project")).toBe(false);
    expect(assertReadOnlyPatScopes("ghp_classic", "repo:status")).toBe(false);
  });

  it("accepte classic read-only allowlist", () => {
    expect(assertReadOnlyPatScopes("ghp_classic", "read:user")).toBe(true);
    expect(
      assertReadOnlyPatScopes("ghp_classic", "read:user, user:email"),
    ).toBe(true);
  });

  it("refuse classic sans scopes", () => {
    expect(assertReadOnlyPatScopes("ghp_classic", null)).toBe(false);
  });
});
