import "server-only";

import { z } from "zod";

import { formatRelativeTime } from "@/lib/github/formatRelativeTime";
import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import { repoCommitSchema, type RepoCommit } from "@/lib/schemas";

const log = createLogger("github.commits");

const ghCommitSchema = z.object({
  sha: z.string().min(1),
  commit: z.object({
    message: z.string(),
    author: z
      .object({
        name: z.string().nullable().optional(),
        date: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
  author: z
    .object({
      login: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type ListCommitsResult =
  | { ok: true; commits: RepoCommit[] }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
    };

export async function listGithubCommits(
  token: string,
  owner: string,
  repo: string,
  ref: string,
): Promise<ListCommitsResult> {
  const result = await githubGet(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    { sha: ref, per_page: "30" },
  );

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  let json: unknown;
  try {
    json = await result.response.json();
  } catch {
    log.error("json");
    return { ok: false, reason: "upstream" };
  }

  if (!Array.isArray(json)) {
    log.error("shape");
    return { ok: false, reason: "upstream" };
  }

  const commits: RepoCommit[] = [];
  for (const item of json) {
    const parsed = ghCommitSchema.safeParse(item);
    if (!parsed.success) {
      continue;
    }
    const message =
      parsed.data.commit.message.split("\n")[0]?.trim() || "(sans message)";
    const author =
      parsed.data.author?.login || parsed.data.commit.author?.name || "unknown";
    const date = parsed.data.commit.author?.date ?? new Date().toISOString();
    commits.push(
      repoCommitSchema.parse({
        id: parsed.data.sha,
        sha: parsed.data.sha.slice(0, 7),
        message,
        author,
        relativeTime: formatRelativeTime(date),
      }),
    );
  }

  return { ok: true, commits };
}
