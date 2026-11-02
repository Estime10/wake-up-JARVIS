import { NextResponse, type NextRequest } from "next/server";

import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { getGithubFileContent } from "@/lib/github/getFileContent";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Contenu fichier (aperçu ≤ 512 Ko). Query `path` + `ref`. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const { owner, repo } = await context.params;
  const path = request.nextUrl.searchParams.get("path")?.trim() ?? "";
  const ref = request.nextUrl.searchParams.get("ref")?.trim() || "HEAD";

  if (!owner || !repo || !path) {
    return NextResponse.json({ ok: false, error: "params" }, { status: 400 });
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const file = await getGithubFileContent(
    tokenLoad.token,
    owner,
    repo,
    path,
    ref,
  );
  if (!file.ok) {
    return githubUpstreamErrorResponse(file.reason);
  }

  return NextResponse.json({ ok: true, file: file.file });
}
