import { NextResponse, type NextRequest } from "next/server";

import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubBranches } from "@/lib/github/listBranches";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Liste toutes les branches. Query `default` = nom branche par défaut. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const { owner, repo } = await context.params;
  if (!owner || !repo) {
    return NextResponse.json({ ok: false, error: "params" }, { status: 400 });
  }

  const defaultBranch =
    request.nextUrl.searchParams.get("default")?.trim() || "main";

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubBranches(
    tokenLoad.token,
    owner,
    repo,
    defaultBranch,
  );
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return NextResponse.json({ ok: true, branches: listed.branches });
}
