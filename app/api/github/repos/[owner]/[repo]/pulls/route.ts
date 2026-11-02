import { NextResponse, type NextRequest } from "next/server";

import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubPulls } from "@/lib/github/listPulls";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Pull requests ouvertes. */
export async function GET(_request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const { owner, repo } = await context.params;
  if (!owner || !repo) {
    return NextResponse.json({ ok: false, error: "params" }, { status: 400 });
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubPulls(tokenLoad.token, owner, repo);
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return NextResponse.json({ ok: true, pulls: listed.pulls });
}
