import "server-only";

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import { repoSummarySchema, type RepoSummary } from "@/lib/schemas";

const log = createLogger("github.repos");

const ghRepoSchema = z.object({
  full_name: z.string().min(1),
  name: z.string().min(1),
  private: z.boolean(),
  default_branch: z.string().min(1),
  updated_at: z.string().min(1),
  owner: z.object({ login: z.string().min(1) }),
});

export type ListReposResult =
  | { ok: true; repos: RepoSummary[] }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "upstream";
    };

/**
 * Tous les repos visibles du PAT (privés + publics), paginé.
 */
export async function listGithubRepos(token: string): Promise<ListReposResult> {
  const repos: RepoSummary[] = [];
  let page = 1;

  while (page <= 10) {
    // visibility=all : privés + publics (sinon certains PAT ne renvoient que public).
    // Fine-grained : seuls les repos accordés au token apparaissent en privé.
    const result = await githubGet(token, "/user/repos", {
      per_page: "100",
      page: String(page),
      sort: "updated",
      direction: "desc",
      visibility: "all",
      affiliation: "owner,collaborator,organization_member",
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason === "not_found" ? "upstream" : result.reason,
      };
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

    if (json.length === 0) {
      break;
    }

    for (const item of json) {
      const parsed = ghRepoSchema.safeParse(item);
      if (!parsed.success) {
        continue;
      }
      const updated = new Date(parsed.data.updated_at);
      repos.push(
        repoSummarySchema.parse({
          id: parsed.data.full_name,
          name: parsed.data.name,
          owner: parsed.data.owner.login,
          private: parsed.data.private,
          defaultBranch: parsed.data.default_branch,
          updatedAt: Number.isNaN(updated.getTime())
            ? new Date().toISOString()
            : updated.toISOString(),
        }),
      );
    }

    if (json.length < 100) {
      break;
    }
    page += 1;
  }

  return { ok: true, repos };
}
