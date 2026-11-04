import { type NextRequest } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubPulls } from "@/lib/github/listPulls";
import { githubOwnerRepoSchema } from "@/lib/github/repoParams";
import { jsonNoStore } from "@/lib/http/jsonNoStore";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Pull requests ouvertes. */
export async function GET(_request: NextRequest, context: RouteContext) {
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

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubPulls(
    tokenLoad.token,
    parsed.data.owner,
    parsed.data.repo,
  );
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return jsonNoStore({ ok: true, pulls: listed.pulls });
}
