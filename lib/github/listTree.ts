import "server-only";

import { z } from "zod";

import {
  buildRepoTree,
  type GithubTreeEntry,
} from "@/lib/github/buildRepoTree";
import { createLogger } from "@/lib/logger";
import { githubGet } from "@/lib/github/request";
import type { RepoTreeNode } from "@/lib/schemas";

const log = createLogger("github.tree");

const treeResponseSchema = z.object({
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      size: z.number().optional(),
    }),
  ),
  truncated: z.boolean().optional(),
});

export type ListTreeResult =
  | { ok: true; tree: RepoTreeNode[]; truncated: boolean; ref: string }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
    };

export async function listGithubTree(
  token: string,
  owner: string,
  repo: string,
  ref: string,
): Promise<ListTreeResult> {
  const result = await githubGet(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(ref)}`,
    { recursive: "1" },
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

  const parsed = treeResponseSchema.safeParse(json);
  if (!parsed.success) {
    log.error("shape");
    return { ok: false, reason: "upstream" };
  }

  const entries: GithubTreeEntry[] = parsed.data.tree.map((item) => ({
    path: item.path,
    type: item.type,
    ...(item.size !== undefined ? { size: item.size } : {}),
  }));

  return {
    ok: true,
    tree: buildRepoTree(entries),
    truncated: parsed.data.truncated === true,
    ref,
  };
}
