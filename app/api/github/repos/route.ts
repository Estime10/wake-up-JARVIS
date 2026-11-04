import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import {
  githubTokenErrorResponse,
  githubUpstreamErrorResponse,
} from "@/lib/github/apiError";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubRepos } from "@/lib/github/listRepos";
import { jsonNoStore } from "@/lib/http/jsonNoStore";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Liste tous les repos (privés + publics) du PAT connecté. */
export async function GET() {
  if (!hasSupabaseServiceRole()) {
    return jsonNoStore({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const tokenLoad = await loadGithubConnectionToken();
  if (!tokenLoad.ok) {
    return githubTokenErrorResponse(tokenLoad);
  }

  const listed = await listGithubRepos(tokenLoad.token);
  if (!listed.ok) {
    return githubUpstreamErrorResponse(listed.reason);
  }

  return jsonNoStore({ ok: true, repos: listed.repos });
}
