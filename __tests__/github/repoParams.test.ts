import { describe, expect, it } from "vitest";

import {
  assertGithubReposUrl,
  githubOwnerRepoSchema,
  parseGithubPath,
  parseGithubRef,
} from "@/lib/github/repoParams";

describe("repoParams", () => {
  it("valide owner/repo nominaux", () => {
    expect(
      githubOwnerRepoSchema.safeParse({ owner: "acme", repo: "app" }).success,
    ).toBe(true);
  });

  it("refuse path traversal", () => {
    expect(parseGithubPath("../../../../user")).toBeNull();
    expect(parseGithubRef("..")).toBeNull();
    expect(parseGithubPath("src/../secret")).toBeNull();
  });

  it("accepte un chemin nominal", () => {
    expect(parseGithubPath("src/index.ts")).toBe("src/index.ts");
    expect(parseGithubRef("main")).toBe("main");
  });

  it("refuse une URL hors /repos/owner/repo", () => {
    expect(assertGithubReposUrl("/user", "acme", "app")).toBe(false);
    expect(
      assertGithubReposUrl("/repos/acme/app/contents/x", "acme", "app"),
    ).toBe(true);
  });
});
