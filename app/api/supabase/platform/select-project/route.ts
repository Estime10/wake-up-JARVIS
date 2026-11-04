import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { supabasePlatformConnectionSchema } from "@/lib/schemas";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("api.supabase.platform.select-project");

const bodySchema = z.object({
  connectionId: z.string().uuid(),
  projectRef: z.string().min(1).max(64),
  projectName: z.string().min(1).max(200),
});

/** Fixe le projet actif d’un compte (et active ce compte). */
export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "admin_supabase_platform_connection_select_project",
    {
      p_user_id: access.user.id,
      p_connection_id: parsed.connectionId,
      p_project_ref: parsed.projectRef.trim(),
      p_project_name: parsed.projectName.trim(),
    },
  );

  if (error || !data) {
    log.error("select_project_failed");
    return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
  }

  const row = data as {
    id: string;
    account_label: string;
    status: string;
    selected_project_ref: string | null;
    selected_project_name: string | null;
    is_active: boolean;
    connected_at: string;
  };

  return NextResponse.json({
    ok: true,
    connection: supabasePlatformConnectionSchema.parse({
      id: row.id,
      accountLabel: row.account_label,
      status: row.status,
      selectedProjectRef: row.selected_project_ref,
      selectedProjectName: row.selected_project_name,
      isActive: row.is_active,
      connectedAt: row.connected_at,
    }),
  });
}
