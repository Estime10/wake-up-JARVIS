import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { resolveRepoQuery } from "@/features/assistant/model/resolveRepoQuery";
import type { RepoSummary } from "@/lib/schemas";

describe("github phrases", () => {
  it.each(["statut github", "github status", "compte github"])(
    "status: %s",
    (phrase) => {
      expect(parseAssistantIntent(phrase)).toEqual({ kind: "github.status" });
    },
  );

  it.each(["liste mes repos", "mes repos", "my github projects"])(
    "repos: %s",
    (phrase) => {
      expect(parseAssistantIntent(phrase)).toEqual({
        kind: "github.list_repos",
      });
    },
  );

  it("prs / commits / branches avec repo", () => {
    expect(parseAssistantIntent("pr ouvertes sur wake-up-JARVIS")).toEqual({
      kind: "github.list_pulls",
      repoQuery: "wake-up-jarvis",
    });
    expect(parseAssistantIntent("commits sur mon/repo")).toEqual({
      kind: "github.list_commits",
      repoQuery: "mon/repo",
    });
    expect(parseAssistantIntent("branches de wake-up-JARVIS")).toEqual({
      kind: "github.list_branches",
      repoQuery: "wake-up-jarvis",
    });
  });
});

describe("resolveRepoQuery", () => {
  const repos: RepoSummary[] = [
    {
      id: "acme/wake-up-JARVIS",
      name: "wake-up-JARVIS",
      owner: "acme",
      private: true,
      defaultBranch: "main",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "acme/other",
      name: "other",
      owner: "acme",
      private: false,
      defaultBranch: "main",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  it("résout owner/repo et nom court", () => {
    expect(resolveRepoQuery("acme/wake-up-JARVIS", repos)?.id).toBe(
      "acme/wake-up-JARVIS",
    );
    expect(resolveRepoQuery("wake-up-JARVIS", repos)?.id).toBe(
      "acme/wake-up-JARVIS",
    );
  });
});
