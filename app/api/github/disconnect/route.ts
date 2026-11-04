import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("api.github.disconnect");

/**
 * Débranche GitHub : purge Vault + ligne.
 * Pas de révocation API GitHub pour un PAT (à faire manuellement côté GitHub).
 */
export async function POST() {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("github_connections")
    .select("id")
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: true, connected: false });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_github_connection_delete", {
    p_user_id: access.user.id,
  });

  if (error) {
    log.error("delete_failed");
    return NextResponse.json({ ok: false, error: "delete" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, connected: false });
}
