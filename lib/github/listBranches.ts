import "server-only";

import { z } from "zod";

import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import { repoBranchSchema, type RepoBranch } from "@/lib/schemas";

const log = createLogger("github.branches");

const ghBranchSchema = z.object({
  name: z.string().min(1),
  protected: z.boolean(),
});

export type ListBranchesResult =
  | { ok: true; branches: RepoBranch[] }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
    };

/**
 * Toutes les branches du dépôt (paginé), marque la branche par défaut.
 */
export async function listGithubBranches(
  token: string,
  owner: string,
  repo: string,
  defaultBranch: string,
): Promise<ListBranchesResult> {
  const branches: RepoBranch[] = [];
  let page = 1;

  while (page <= 10) {
    const result = await githubGet(
      token,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
      { per_page: "100", page: String(page) },
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

    if (json.length === 0) {
      break;
    }

    for (const item of json) {
      const parsed = ghBranchSchema.safeParse(item);
      if (!parsed.success) {
        continue;
      }
      branches.push(
        repoBranchSchema.parse({
          name: parsed.data.name,
          protected: parsed.data.protected,
          isDefault: parsed.data.name === defaultBranch,
        }),
      );
    }

    if (json.length < 100) {
      break;
    }
    page += 1;
  }

  branches.sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "fr");
  });

  return { ok: true, branches };
}
