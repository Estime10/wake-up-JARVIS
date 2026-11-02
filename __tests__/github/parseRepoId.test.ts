import { describe, expect, it } from "vitest";

import { parseRepoId } from "@/lib/github/parseRepoId";

describe("parseRepoId", () => {
  it("décompose owner/repo", () => {
    expect(parseRepoId("estimevangu/wake-up-JARVIS")).toEqual({
      owner: "estimevangu",
      repo: "wake-up-JARVIS",
    });
  });

  it("refuse les ids invalides", () => {
    expect(parseRepoId("")).toBeNull();
    expect(parseRepoId("seul")).toBeNull();
    expect(parseRepoId("/repo")).toBeNull();
    expect(parseRepoId("a/b/c")).toBeNull();
  });
});
