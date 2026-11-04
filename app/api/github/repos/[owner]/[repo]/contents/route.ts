import { type NextRequest } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { getGithubFileContent } from "@/lib/github/getFileContent";
import {
  githubOwnerRepoSchema,
  parseGithubPath,
  parseGithubRef,
} from "@/lib/github/repoParams";
import { jsonNoStore } from "@/lib/http/jsonNoStore";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ owner: string; repo: string }>;
};

/** Contenu fichier (aperçu ≤ 512 Ko). Query `path` + `ref`. */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return jsonNoStore({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const raw = await context.params;
  const parsed = githubOwnerRepoSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonNoStore({ ok: false, error: "params" }, { status: 400 });
  }

  const path = parseGithubPath(
    request.nextUrl.searchParams.get("path")?.trim() ?? "",
  );
  const ref = parseGithubRef(
    request.nextUrl.searchParams.get("ref")?.trim() || "HEAD",
  );
  if (!path || !ref) {
    return jsonNoStore({ ok: false, error: "params" }, { status: 400 });
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const file = await getGithubFileContent(
    tokenLoad.token,
    parsed.data.owner,
    parsed.data.repo,
    path,
    ref,
  );
  if (!file.ok) {
    return githubUpstreamErrorResponse(file.reason);
  }

  return jsonNoStore({ ok: true, file: file.file });
}
