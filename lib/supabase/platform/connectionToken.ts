import "server-only";

import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlatformTokenLoad =
  | {
      ok: true;
      token: string;
      connectionId: string;
      accountLabel: string;
      selectedProjectRef: string | null;
      selectedProjectName: string | null;
    }
  | {
      ok: false;
      reason: "auth" | "missing" | "needs_reauth" | "vault" | "config";
    };

type PlatformConnectionRow = {
  id: string;
  account_label: string;
  status: string;
  selected_project_ref: string | null;
  selected_project_name: string | null;
};

/**
 * Charge le access token Vault d’une connexion (ou de la connexion active).
 */
export async function loadSupabasePlatformToken(
  connectionId?: string,
): Promise<PlatformTokenLoad> {
  if (!hasSupabaseServiceRole()) {
    return { ok: false, reason: "config" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "auth" };
  }

  let query = supabase
    .from("supabase_platform_connections")
    .select(
      "id, account_label, status, selected_project_ref, selected_project_name",
    );

  if (connectionId) {
    query = query.eq("id", connectionId);
  } else {
    query = query.eq("is_active", true);
  }

  const { data: row, error } = await query.maybeSingle();

  if (error) {
    return { ok: false, reason: "config" };
  }
  if (!row) {
    return { ok: false, reason: "missing" };
  }

  const typed = row as PlatformConnectionRow;
  if (typed.status === "needs_reauth") {
    return { ok: false, reason: "needs_reauth" };
  }

  const admin = createSupabaseAdminClient();
  const { data: token, error: tokenError } = await admin.rpc(
    "admin_supabase_platform_connection_read_token",
    { p_user_id: user.id, p_connection_id: typed.id },
  );

  if (tokenError || typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "vault" };
  }

  return {
    ok: true,
    token,
    connectionId: typed.id,
    accountLabel: typed.account_label,
    selectedProjectRef: typed.selected_project_ref,
    selectedProjectName: typed.selected_project_name,
  };
}
