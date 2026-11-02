import { NextResponse, type NextRequest } from "next/server";

import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubCommits } from "@/lib/github/listCommits";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Commits récents. Query `ref` = branche / sha. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const { owner, repo } = await context.params;
  if (!owner || !repo) {
    return NextResponse.json({ ok: false, error: "params" }, { status: 400 });
  }

  const ref = request.nextUrl.searchParams.get("ref")?.trim() || "HEAD";

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubCommits(tokenLoad.token, owner, repo, ref);
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return NextResponse.json({ ok: true, commits: listed.commits });
}
