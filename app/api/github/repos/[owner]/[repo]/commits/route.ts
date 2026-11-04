import { type NextRequest } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubCommits } from "@/lib/github/listCommits";
import { githubOwnerRepoSchema, parseGithubRef } from "@/lib/github/repoParams";
import { jsonNoStore } from "@/lib/http/jsonNoStore";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Commits récents. Query `ref` = branche / sha. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return jsonNoStore({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const parsed = githubOwnerRepoSchema.safeParse(await context.params);
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "params" }, { status: 400 });
  }

  const ref = parseGithubRef(
    request.nextUrl.searchParams.get("ref")?.trim() || "HEAD",
  );
  if (!ref) {
    return jsonNoStore({ ok: false, error: "params" }, { status: 400 });
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubCommits(
    tokenLoad.token,
    parsed.data.owner,
    parsed.data.repo,
    ref,
  );
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return jsonNoStore({ ok: true, commits: listed.commits });
}
