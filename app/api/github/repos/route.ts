import { NextResponse } from "next/server";

import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubRepos } from "@/lib/github/listRepos";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Liste tous les repos (privés + publics) du PAT connecté. */
export async function GET() {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubRepos(tokenLoad.token);
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return NextResponse.json({ ok: true, repos: listed.repos });
}
