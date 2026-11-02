import "server-only";

import { z } from "zod";

import { formatRelativeTime } from "@/lib/github/formatRelativeTime";
import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import { repoPullSchema, type RepoPull } from "@/lib/schemas";

const log = createLogger("github.pulls");

const ghPullSchema = z.object({
  id: z.number().int(),
  number: z.number().int().positive(),
  title: z.string(),
  state: z.enum(["open", "closed"]),
  created_at: z.string(),
  user: z
    .object({
      login: z.string(),
    })
    .nullable()
    .optional(),
});

export type ListPullsResult =
  | { ok: true; pulls: RepoPull[] }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
    };

export async function listGithubPulls(
  token: string,
  owner: string,
  repo: string,
): Promise<ListPullsResult> {
  const result = await githubGet(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    { state: "open", per_page: "30", sort: "updated", direction: "desc" },
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

  const pulls: RepoPull[] = [];
  for (const item of json) {
    const parsed = ghPullSchema.safeParse(item);
    if (!parsed.success) {
      continue;
    }
    pulls.push(
      repoPullSchema.parse({
        id: String(parsed.data.id),
        number: parsed.data.number,
        title: parsed.data.title,
        author: parsed.data.user?.login ?? "unknown",
        state: parsed.data.state,
        relativeTime: formatRelativeTime(parsed.data.created_at),
      }),
    );
  }

  return { ok: true, pulls };
}
