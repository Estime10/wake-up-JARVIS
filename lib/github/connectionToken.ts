import "server-only";

import { fetchGithubUser } from "@/lib/github/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GithubTokenLoad =
  | { ok: true; token: string; login: string; connectionId: string }
  | {
      ok: false;
      reason:
        "auth" | "missing" | "needs_reauth" | "vault" | "config" | "scopes";
    };

type GithubConnectionRow = {
  id: string;
  github_login: string;
  status: string;
  expires_at: string | null;
};

/**
 * Charge le PAT Vault pour l’user session — server-only.
 * Ne sélectionne jamais vault_secret_id (lecture via RPC liée au propriétaire).
 */
export async function loadGithubConnectionToken(): Promise<GithubTokenLoad> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "auth" };
  }

  const { data: row, error } = await supabase
    .from("github_connections")
    .select("id, github_login, status, expires_at")
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "config" };
  }
  if (!row) {
    return { ok: false, reason: "missing" };
  }

  const typed = row as GithubConnectionRow;

  if (
    typed.status === "needs_reauth" ||
    (typed.expires_at && Date.parse(typed.expires_at) < Date.now())
  ) {
    return { ok: false, reason: "needs_reauth" };
  }

  const admin = createSupabaseAdminClient();
  const { data: token, error: tokenError } = await admin.rpc(
    "admin_github_connection_read_token",
    { p_user_id: user.id, p_connection_id: typed.id },
  );

  if (tokenError || typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "vault" };
  }

  // IV2-06 — revérifier scopes / validité à chaque usage, pas seulement à la connexion.
  const live = await fetchGithubUser(token);
  if (!live.ok) {
    if (live.reason === "scopes") {
      return { ok: false, reason: "scopes" };
    }
    if (live.reason === "unauthorized" || live.reason === "forbidden") {
      return { ok: false, reason: "needs_reauth" };
    }
    return { ok: false, reason: "config" };
  }

  return {
    ok: true,
    token,
    login: live.user.login || typed.github_login,
    connectionId: typed.id,
  };
}
