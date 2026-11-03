import { describe, expect, it } from "vitest";

import { parseGithubIntents } from "@/features/assistant/model/parseGithubIntents";
import { resolveRepoQuery } from "@/features/assistant/model/resolveRepoQuery";
import type { RepoSummary } from "@/lib/schemas";

describe("parseGithubIntents", () => {
  it.each([
    "statut github",
    "suis-je connecté à github",
    "compte github",
    "github ok",
  ])("status: %s", (phrase) => {
    expect(parseGithubIntents(phrase)).toEqual({ kind: "github.status" });
  });

  it.each([
    "liste mes repos",
    "montre mes dépôts",
    "quels sont mes repos",
    "github repos",
    "my repos",
    "combien de repos",
  ])("list_repos: %s", (phrase) => {
    expect(parseGithubIntents(phrase)).toEqual({ kind: "github.list_repos" });
  });

  it.each([
    ["PRs sur wake-up-JARVIS", "wake-up-JARVIS"],
    ["liste les pull requests sur mon/repo", "mon/repo"],
    ["wake-up-JARVIS prs", "wake-up-JARVIS"],
    ["pulls on foo/bar", "foo/bar"],
  ])("list_pulls: %s", (phrase, repo) => {
    expect(parseGithubIntents(phrase)).toEqual({
      kind: "github.list_pulls",
      repoQuery: repo,
    });
  });

  it.each([
    ["commits sur wake-up-JARVIS", "wake-up-JARVIS"],
    ["historique git de mon/repo", "mon/repo"],
    ["wake-up-JARVIS commits", "wake-up-JARVIS"],
  ])("list_commits: %s", (phrase, repo) => {
    expect(parseGithubIntents(phrase)).toEqual({
      kind: "github.list_commits",
      repoQuery: repo,
    });
  });

  it.each([
    ["branches de wake-up-JARVIS", "wake-up-JARVIS"],
    ["liste les branches sur mon/repo", "mon/repo"],
    ["wake-up-JARVIS branches", "wake-up-JARVIS"],
  ])("list_branches: %s", (phrase, repo) => {
    expect(parseGithubIntents(phrase)).toEqual({
      kind: "github.list_branches",
      repoQuery: repo,
    });
  });

  it("ignore le hors-sujet", () => {
    expect(parseGithubIntents("mails label DEV")).toBeNull();
    expect(parseGithubIntents("bonjour")).toBeNull();
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
    expect(resolveRepoQuery("JARVIS", repos)?.id).toBe("acme/wake-up-JARVIS");
  });
});
